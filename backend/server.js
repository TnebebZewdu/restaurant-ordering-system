require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const server = http.createServer(app);

// ==================================================
// ================= SOCKET.IO =======================
// ==================================================

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5176',
      'http://localhost:5175',
      'http://localhost:5174',
      'http://localhost:5173'
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// ==================================================
// ================= CORS ============================
// ==================================================

app.use(
  cors({
    origin: [
      'http://localhost:5176',
      'http://localhost:5175',
      'http://localhost:5174',
      'http://localhost:5173'
    ]
  })
);

app.use(express.json());

// ==================================================
// ================= DATABASE ========================
// ==================================================

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurant_db',

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ==================================================
// ============== DATABASE CONNECTION TEST ===========
// ==================================================

(async () => {
  try {
    const connection = await db.getConnection();

    console.log('MySQL connected successfully');

    connection.release();
  } catch (error) {
    console.error(
      'MySQL connection failed:',
      error
    );
  }
})();

// ==================================================
// ================= STAFF AUTH ======================
// ==================================================
//
// Customer does NOT need authentication.
//
// Admin and Kitchen require a token.

// ==================================================

const staffTokens = {
  'admin-token': 'admin',
  'kitchen-token': 'kitchen'
};

// --------------------------------------------------
// AUTHENTICATE STAFF
// --------------------------------------------------

const authenticateStaff = (req, res, next) => {
  const authHeader =
    req.headers.authorization || '';

  const [scheme, token] =
    authHeader.split(' ');

  if (
    scheme !== 'Bearer' ||
    !token
  ) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  const role =
    staffTokens[token];

  if (!role) {
    return res.status(401).json({
      error:
        'Invalid or expired authentication token'
    });
  }

  req.user = {
    role
  };

  next();
};

// --------------------------------------------------
// ROLE AUTHORIZATION
// --------------------------------------------------

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (
      !req.user ||
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    next();
  };
};

// ==================================================
// ================= SOCKET CONNECTION ===============
// ==================================================

io.on('connection', (socket) => {
  console.log(
    'Client connected:',
    socket.id
  );

  socket.on('disconnect', () => {
    console.log(
      'Client disconnected:',
      socket.id
    );
  });
});

// ==================================================
// ================= LOGIN ===========================
// ==================================================

app.post('/api/login', (req, res) => {
  const {
    pin,
    role
  } = req.body;

  if (!pin || !role) {
    return res.status(400).json({
      error:
        'PIN and role are required'
    });
  }

  // -----------------------------
  // ADMIN LOGIN
  // -----------------------------

  if (role === 'admin' && pin === process.env.ADMIN_PIN) {
  return res.json({ success: true, token: 'admin-token', role: 'admin' });
}

  // -----------------------------
  // KITCHEN LOGIN
  // -----------------------------

 if (role === 'kitchen' && pin === process.env.KITCHEN_PIN) {
  return res.json({ success: true, token: 'kitchen-token', role: 'kitchen' });
}

  return res.status(401).json({
    error: 'Invalid PIN'
  });
});

// ==================================================
// ================= GET MENU ========================
// ==================================================
//
// PUBLIC
//
// Customer needs this to see the menu.
//
// ==================================================

app.get(
  '/api/menu',
  async (req, res) => {
    try {
      const [rows] =
        await db.query(`
          SELECT
            m.id,
            m.name,
            m.price,
            m.category_id,
            m.image_url,
            m.is_available,
            c.name AS category_name
          FROM menu m
          LEFT JOIN categories c
            ON m.category_id = c.id
          ORDER BY m.id DESC
        `);

      res.json(rows);

    } catch (error) {
      console.error(
        'Error fetching menu:',
        error
      );

      res.status(500).json({
        error:
          'Failed to load menu'
      });
    }
  }
);

// ==================================================
// ================ GET CATEGORIES ===================
// ==================================================
//
// PUBLIC
//
// ==================================================

app.get(
  '/api/categories',
  async (req, res) => {
    try {
      const [rows] =
        await db.query(`
          SELECT
            id,
            name
          FROM categories
          ORDER BY name ASC
        `);

      res.json(rows);

    } catch (error) {
      console.error(
        'Error fetching categories:',
        error
      );

      res.status(500).json({
        error:
          'Failed to load categories'
      });
    }
  }
);

// ==================================================
// ================= ADD MENU ========================
// ==================================================
//
// ADMIN ONLY
//
// ==================================================

app.post(
  '/api/menu',
  authenticateStaff,
  requireRole('admin'),
  async (req, res) => {

    const {
      name,
      price,
      category_id,
      image_url
    } = req.body;

    if (
      !name ||
      price === undefined
    ) {
      return res.status(400).json({
        error:
          'Name and price are required'
      });
    }

    const numericPrice =
      Number(price);

    if (
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice < 0
    ) {
      return res.status(400).json({
        error:
          'Price must be a valid positive number'
      });
    }

    try {

      const [result] =
        await db.query(
          `
          INSERT INTO menu
            (
              name,
              price,
              category_id,
              image_url,
              is_available
            )
          VALUES
            (?, ?, ?, ?, ?)
          `,
          [
            name.trim(),
            numericPrice,
            category_id || null,
            image_url || null,
            1
          ]
        );

      const [rows] =
        await db.query(
          `
          SELECT
            m.id,
            m.name,
            m.price,
            m.category_id,
            m.image_url,
            m.is_available,
            c.name AS category_name
          FROM menu m
          LEFT JOIN categories c
            ON m.category_id = c.id
          WHERE m.id = ?
          `,
          [
            result.insertId
          ]
        );

      res.status(201).json(
        rows[0]
      );

    } catch (error) {
      console.error(
        'Error adding menu item:',
        error
      );

      res.status(500).json({
        error:
          'Failed to add menu item'
      });
    }
  }
);

// ==================================================
// ============== UPDATE AVAILABILITY ================
// ==================================================
//
// ADMIN ONLY
//
// ==================================================

app.patch(
  '/api/menu/:id/availability',
  authenticateStaff,
  requireRole('admin'),
  async (req, res) => {

    const menuId =
      Number(req.params.id);

    const {
      is_available
    } = req.body;

    if (
      !Number.isInteger(
        menuId
      ) ||
      menuId <= 0
    ) {
      return res.status(400).json({
        error:
          'Invalid menu ID'
      });
    }

    try {

      const [result] =
        await db.query(
          `
          UPDATE menu
          SET is_available = ?
          WHERE id = ?
          `,
          [
            is_available ? 1 : 0,
            menuId
          ]
        );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          error:
            'Menu item not found'
        });
      }

      res.json({
        success: true,
        id: menuId,
        is_available:
          is_available ? 1 : 0
      });

    } catch (error) {

      console.error(
        'Error updating availability:',
        error
      );

      res.status(500).json({
        error:
          'Failed to update availability'
      });
    }
  }
);

// ==================================================
// ================= ARCHIVE MENU ====================
// ==================================================
//
// ADMIN ONLY
//
// IMPORTANT:
// We DO NOT physically delete menu items.
//
// Existing orders contain a foreign key to menu.id.
// Physically deleting a menu item could remove
// historical order_items because of ON DELETE CASCADE.
//
// Instead, we archive the item by setting:
//
// is_available = 0
//
// This keeps:
// - old orders
// - order history
// - historical prices
// - analytics
//
// safe.
//
// ==================================================

app.delete(
  '/api/menu/:id',
  authenticateStaff,
  requireRole('admin'),
  async (req, res) => {

    const menuId =
      Number(req.params.id);

    if (
      !Number.isInteger(
        menuId
      ) ||
      menuId <= 0
    ) {
      return res.status(400).json({
        error:
          'Invalid menu ID'
      });
    }

    try {

      const [result] =
        await db.query(
          `
          UPDATE menu
          SET is_available = 0
          WHERE id = ?
          `,
          [menuId]
        );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          error:
            'Menu item not found'
        });
      }

      res.json({
        success: true,
        message:
          'Menu item archived successfully'
      });

    } catch (error) {

      console.error(
        'Error archiving menu item:',
        error
      );

      res.status(500).json({
        error:
          'Failed to archive menu item'
      });
    }
  }
);

// ==================================================
// ================ ACTIVE ORDERS ====================
// ==================================================
//
// KITCHEN + ADMIN
//
// Kitchen uses this endpoint to display orders.
//
// ==================================================

app.get(
  '/api/orders/active',
  authenticateStaff,
  requireRole(
    'kitchen',
    'admin'
  ),
  async (req, res) => {

    try {

      const [orders] =
        await db.query(`
          SELECT
            id,
            table_number,
            order_type,
            total_amount,
            status,
            created_at
          FROM orders
          WHERE status IN (
            'pending',
            'preparing'
          )
          ORDER BY created_at ASC
        `);

      for (
        const order of orders
      ) {

        const [items] =
          await db.query(
            `
            SELECT
              oi.id,
              oi.menu_id,
              COALESCE(
                m.name,
                'የታዘዘ ምግብ'
              ) AS name,
              oi.quantity,
              oi.price,
              oi.notes
            FROM order_items oi
            LEFT JOIN menu m
              ON oi.menu_id = m.id
            WHERE oi.order_id = ?
            ORDER BY oi.id ASC
            `,
            [order.id]
          );

        order.items = items;
      }

      res.json(orders);

    } catch (error) {

      console.error(
        'Error fetching active orders:',
        error
      );

      res.status(500).json({
        error:
          'Failed to load active orders'
      });
    }
  }
);

// ==================================================
// ================= GET ORDER =======================
// ==================================================
//
// PUBLIC
//
// Customer uses this to check order status.
//
// ==================================================

app.get(
  '/api/orders/:id',
  async (req, res) => {

    const orderId =
      Number(req.params.id);

    if (
      !Number.isInteger(
        orderId
      ) ||
      orderId <= 0
    ) {
      return res.status(400).json({
        error:
          'Invalid order ID'
      });
    }

    try {

      const [orders] =
        await db.query(
          `
          SELECT
            id,
            table_number,
            order_type,
            total_amount,
            status,
            created_at
          FROM orders
          WHERE id = ?
          `,
          [orderId]
        );

      if (
        orders.length === 0
      ) {
        return res.status(404).json({
          error:
            'Order not found'
        });
      }

      const order =
        orders[0];

      const [items] =
        await db.query(
          `
          SELECT
            oi.id,
            oi.menu_id,
            COALESCE(
              m.name,
              'የታዘዘ ምግብ'
            ) AS name,
            oi.quantity,
            oi.price,
            oi.notes
          FROM order_items oi
          LEFT JOIN menu m
            ON oi.menu_id = m.id
          WHERE oi.order_id = ?
          ORDER BY oi.id ASC
          `,
          [orderId]
        );

      order.items = items;

      res.json(order);

    } catch (error) {

      console.error(
        'Error fetching order:',
        error
      );

      res.status(500).json({
        error:
          'Failed to load order'
      });
    }
  }
);

// ==================================================
// ================= CREATE ORDER ====================
// ==================================================
//
// PUBLIC
//
// Customer places an order.
//
// ==================================================

app.post(
  '/api/orders',
  async (req, res) => {

    const {
      table_number,
      order_type,
      items
    } = req.body;

    // ------------------------------------------------
    // VALIDATE ITEMS
    // ------------------------------------------------

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        error:
          'የተሳሳተ የትዕዛዝ መረጃ'
      });
    }

    const selectedType =
      order_type || 'dine_in';

    // ------------------------------------------------
    // VALIDATE ORDER TYPE
    // ------------------------------------------------

    if (
      ![
        'dine_in',
        'takeaway'
      ].includes(
        selectedType
      )
    ) {
      return res.status(400).json({
        error:
          'የተሳሳተ የትዕዛዝ አይነት'
      });
    }

    // ------------------------------------------------
    // VALIDATE TABLE
    // ------------------------------------------------

    let assignedTable = 0;

    if (
      selectedType ===
      'dine_in'
    ) {

      const parsedTableNumber =
        Number(table_number);

      if (
        !Number.isInteger(
          parsedTableNumber
        ) ||
        parsedTableNumber <= 0
      ) {
        return res.status(400).json({
          error:
            'እባክዎ ትክክለኛ የጠረጴዛ ቁጥር ያስገቡ!'
        });
      }

      assignedTable =
        parsedTableNumber;
    }

    let connection;

    try {

      // ------------------------------------------------
      // GET DEDICATED CONNECTION
      // ------------------------------------------------

      connection =
        await db.getConnection();

      // ------------------------------------------------
      // START TRANSACTION
      // ------------------------------------------------

      await connection.beginTransaction();

      let calculatedTotal = 0;

      const validatedItems = [];

      // ------------------------------------------------
      // VALIDATE EVERY ITEM
      // ------------------------------------------------

      for (
        const item of items
      ) {

        const menuId =
          Number(
            item.menu_id ??
            item.id
          );

        if (
          !Number.isInteger(
            menuId
          ) ||
          menuId <= 0
        ) {
          throw new Error(
            'ትዕዛዙ ውስጥ ትክክለኛ የምግብ ID የለም'
          );
        }

        // ------------------------------------------------
        // VALIDATE QUANTITY
        // ------------------------------------------------

        const quantity =
          Number(
            item.quantity
          );

        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity <= 0
        ) {
          throw new Error(
            `የምግብ ብዛት ትክክል አይደለም (menu_id: ${menuId})`
          );
        }

        // ------------------------------------------------
        // GET REAL MENU DATA
        // ------------------------------------------------

        const [menuRows] =
          await connection.query(
            `
            SELECT
              id,
              name,
              price,
              is_available
            FROM menu
            WHERE id = ?
            FOR UPDATE
            `,
            [menuId]
          );

        if (
          menuRows.length === 0
        ) {
          throw new Error(
            `የምግብ ID ${menuId} አልተገኘም`
          );
        }

        const menuItem =
          menuRows[0];

        // ------------------------------------------------
        // CHECK AVAILABILITY
        // ------------------------------------------------

        if (
          Number(
            menuItem.is_available
          ) !== 1
        ) {
          throw new Error(
            `“${menuItem.name}” አሁን አይገኝም`
          );
        }

        // ------------------------------------------------
        // USE DATABASE PRICE
        // ------------------------------------------------

        const actualPrice =
          Number(
            menuItem.price
          );

        const itemTotal =
          actualPrice *
          quantity;

        calculatedTotal +=
          itemTotal;

        // ------------------------------------------------
        // NOTES
        // ------------------------------------------------

        const notes =
          typeof item.notes ===
          'string'
            ? item.notes.trim()
            : null;

        // ------------------------------------------------
        // SAVE VALIDATED ITEM
        // ------------------------------------------------

        validatedItems.push({
          menuId,
          quantity,
          price:
            actualPrice,
          notes:
            notes || null,
          name:
            menuItem.name
        });
      }

      // ------------------------------------------------
      // CREATE ORDER
      // ------------------------------------------------

      const [orderResult] =
        await connection.query(
          `
          INSERT INTO orders
            (
              table_number,
              order_type,
              total_amount,
              status
            )
          VALUES
            (?, ?, ?, ?)
          `,
          [
            assignedTable,
            selectedType,
            calculatedTotal,
            'pending'
          ]
        );

      const orderId =
        orderResult.insertId;

      // ------------------------------------------------
      // INSERT ORDER ITEMS
      // ------------------------------------------------

      for (
        const item of
        validatedItems
      ) {

        await connection.query(
          `
          INSERT INTO order_items
            (
              order_id,
              menu_id,
              quantity,
              price,
              notes
            )
          VALUES
            (?, ?, ?, ?, ?)
          `,
          [
            orderId,
            item.menuId,
            item.quantity,
            item.price,
            item.notes
          ]
        );
      }

      // ------------------------------------------------
      // COMMIT
      // ------------------------------------------------

      await connection.commit();

      // ------------------------------------------------
      // GET SAVED ITEMS
      // ------------------------------------------------

      const [insertedItems] =
        await db.query(
          `
          SELECT
            oi.id,
            COALESCE(
              m.name,
              'የታዘዘ ምግብ'
            ) AS name,
            oi.quantity,
            oi.price,
            oi.notes
          FROM order_items oi
          LEFT JOIN menu m
            ON oi.menu_id = m.id
          WHERE oi.order_id = ?
          ORDER BY oi.id ASC
          `,
          [orderId]
        );

      // ------------------------------------------------
      // CREATE KITCHEN PAYLOAD
      // ------------------------------------------------

      const newOrderPayload = {
        id:
          orderId,

        table_number:
          assignedTable,

        order_type:
          selectedType,

        total_amount:
          calculatedTotal,

        status:
          'pending',

        created_at:
          new Date(),

        items:
          insertedItems
      };

      // ------------------------------------------------
      // REAL-TIME KITCHEN NOTIFICATION
      // ------------------------------------------------

      io.emit(
        'new_order',
        newOrderPayload
      );

      // ------------------------------------------------
      // CUSTOMER RESPONSE
      // ------------------------------------------------

      res.status(201).json({
        message:
          'ትዕዛዝ በስኬት ተመዝግቧል',

        orderId
      });

    } catch (error) {

      // ------------------------------------------------
      // ROLLBACK
      // ------------------------------------------------

      if (connection) {

        try {
          await connection.rollback();
        } catch (
          rollbackError
        ) {
          console.error(
            'Rollback Error:',
            rollbackError
          );
        }
      }

      console.error(
        'Error placing order:',
        error
      );

      // ------------------------------------------------
      // CLIENT VALIDATION ERRORS
      // ------------------------------------------------

      const clientErrors = [
        'የተሳሳተ',
        'አልተገኘም',
        'አይገኝም',
        'ብዛት',
        'ID'
      ];

      const isClientError =
        clientErrors.some(
          (message) =>
            error.message.includes(
              message
            )
        );

      res.status(
        isClientError
          ? 400
          : 500
      ).json({
        error:
          error.message
      });

    } finally {

      // ------------------------------------------------
      // RELEASE CONNECTION
      // ------------------------------------------------

      if (connection) {
        connection.release();
      }
    }
  }
);

// ==================================================
// ================ UPDATE ORDER STATUS ==============
// ==================================================
//
// KITCHEN + ADMIN
//
// Kitchen can change:
//
// pending -> preparing
// preparing -> completed
// pending -> cancelled
//
// ==================================================

app.patch(
  '/api/orders/:id/status',
  authenticateStaff,
  requireRole(
    'kitchen',
    'admin'
  ),
  async (req, res) => {

    const orderId =
      Number(req.params.id);

    const {
      status
    } = req.body;

    const validStatuses = [
      'pending',
      'preparing',
      'completed',
      'cancelled'
    ];

    // ------------------------------------------------
    // VALIDATE ORDER ID
    // ------------------------------------------------

    if (
      !Number.isInteger(
        orderId
      ) ||
      orderId <= 0
    ) {
      return res.status(400).json({
        error:
          'Invalid order ID'
      });
    }

    // ------------------------------------------------
    // VALIDATE STATUS
    // ------------------------------------------------

    if (
      !validStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        error:
          'Invalid order status'
      });
    }

    try {

      // ------------------------------------------------
      // CHECK ORDER EXISTS
      // ------------------------------------------------

      const [existingOrders] =
        await db.query(
          `
          SELECT
            id,
            status
          FROM orders
          WHERE id = ?
          `,
          [orderId]
        );

      if (
        existingOrders.length ===
        0
      ) {
        return res.status(404).json({
          error:
            'Order not found'
        });
      }

      const currentStatus =
        existingOrders[0].status;

      // ------------------------------------------------
      // PREVENT CHANGING FINISHED ORDERS
      // ------------------------------------------------

      if (
        currentStatus ===
          'completed' &&
        status !==
          'completed'
      ) {
        return res.status(400).json({
          error:
            'Completed orders cannot be changed'
        });
      }

      if (
        currentStatus ===
          'cancelled' &&
        status !==
          'cancelled'
      ) {
        return res.status(400).json({
          error:
            'Cancelled orders cannot be changed'
        });
      }

      // ------------------------------------------------
      // UPDATE
      // ------------------------------------------------

      const [result] =
        await db.query(
          `
          UPDATE orders
          SET status = ?
          WHERE id = ?
          `,
          [
            status,
            orderId
          ]
        );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          error:
            'Order not found'
        });
      }

      // ------------------------------------------------
      // REAL-TIME CUSTOMER UPDATE
      // ------------------------------------------------

      io.emit(
        'order_status_updated',
        {
          orderId,
          status
        }
      );

      res.json({
        success: true,
        orderId,
        status
      });

    } catch (error) {

      console.error(
        'Error updating order status:',
        error
      );

      res.status(500).json({
        error:
          'Failed to update order status'
      });
    }
  }
);

// ==================================================
// ================= ANALYTICS =======================
// ==================================================
//
// ADMIN ONLY
//
// ==================================================

app.get(
  '/api/analytics',
  authenticateStaff,
  requireRole('admin'),
  async (req, res) => {

    try {

      // ----------------------------------------------
      // TOTAL ORDERS
      // ----------------------------------------------

      const [
        orderCountRows
      ] = await db.query(`
        SELECT
          COUNT(*) AS totalOrders
        FROM orders
        WHERE status != 'cancelled'
      `);

      // ----------------------------------------------
      // TOTAL REVENUE
      // ----------------------------------------------

      const [
        revenueRows
      ] = await db.query(`
        SELECT
          COALESCE(
            SUM(total_amount),
            0
          ) AS totalRevenue
        FROM orders
        WHERE status = 'completed'
      `);

      // ----------------------------------------------
      // TOP SELLING ITEMS
      // ----------------------------------------------

      const [
        topSellingRows
      ] = await db.query(`
        SELECT
          m.id,
          m.name,
          SUM(
            oi.quantity
          ) AS quantity
        FROM order_items oi
        INNER JOIN orders o
          ON oi.order_id = o.id
        INNER JOIN menu m
          ON oi.menu_id = m.id
        WHERE o.status =
          'completed'
        GROUP BY
          m.id,
          m.name
        ORDER BY
          quantity DESC
        LIMIT 5
      `);

      // ----------------------------------------------
      // RESPONSE
      // ----------------------------------------------

      res.json({

        totalOrders:
          Number(
            orderCountRows[0]
              .totalOrders
          ),

        totalRevenue:
          Number(
            revenueRows[0]
              .totalRevenue
          ),

        topSellingItems:
          topSellingRows

      });

    } catch (error) {

      console.error(
        'Error fetching analytics:',
        error
      );

      res.status(500).json({
        error:
          'Failed to load analytics'
      });
    }
  }
);

// ==================================================
// ================= HEALTH CHECK ====================
// ==================================================

app.get(
  '/api/health',
  (req, res) => {

    res.json({
      success: true,
      message:
        'Restaurant backend is running',
      server:
        'Node.js + Express',
      database:
        'MySQL',
      socket:
        'Socket.IO'
    });

  }
);

// ==================================================
// ================= START SERVER ====================
// ==================================================

const PORT =
  Number(process.env.PORT) || 5000;

server.listen(
  PORT,
  () => {

    console.log(
      `Restaurant server running on port ${PORT}`
    );

    console.log(
      `API: http://localhost:${PORT}`
    );

  }
);