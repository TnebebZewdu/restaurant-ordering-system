CREATE DATABASE IF NOT EXISTS restaurant_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE restaurant_db;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

CREATE TABLE IF NOT EXISTS categories (
  id INT(11) NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu (
  id INT(11) NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category_id INT(11) DEFAULT NULL,
  image_url TEXT DEFAULT NULL,
  is_available TINYINT(1) DEFAULT 1,
  PRIMARY KEY (id),
  KEY category_id (category_id),
  CONSTRAINT menu_ibfk_1
    FOREIGN KEY (category_id)
    REFERENCES categories (id)
    ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id INT(11) NOT NULL AUTO_INCREMENT,
  table_number INT(11) NOT NULL,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('pending','preparing','completed','cancelled') DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  order_type VARCHAR(20) DEFAULT 'dine_in',
  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT(11) NOT NULL AUTO_INCREMENT,
  order_id INT(11) NOT NULL,
  menu_id INT(11) NOT NULL,
  quantity INT(11) NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  notes TEXT DEFAULT NULL,
  PRIMARY KEY (id),
  KEY order_id (order_id),
  KEY menu_id (menu_id),
  CONSTRAINT order_items_ibfk_1
    FOREIGN KEY (order_id)
    REFERENCES orders (id)
    ON DELETE CASCADE,
  CONSTRAINT order_items_ibfk_2
    FOREIGN KEY (menu_id)
    REFERENCES menu (id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

INSERT INTO categories (id, name) VALUES
  (1, 'Starters'),
  (2, 'Main Course'),
  (3, 'Pizza & Pasta'),
  (4, 'Desserts'),
  (5, 'Drinks')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO menu
  (id, name, price, category_id, image_url, is_available)
VALUES
  (1, 'Crispy Sambusa Set', 150.00, 1, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', 1),
  (2, 'Spicy BBQ Wings', 280.00, 1, 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80', 1),
  (3, 'Fresh Garden Salad', 180.00, 1, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', 1),
  (4, 'Garlic Bread with Cheese', 200.00, 1, 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=600&q=80', 1),
  (5, 'Creamy Mushroom Soup', 170.00, 1, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80', 1),
  (6, 'Avocado Green Salad', 190.00, 1, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 1),
  (7, 'Signature Beef Burger', 350.00, 2, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', 1),
  (8, 'Crispy Chicken Zinger Burger', 340.00, 2, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80', 1),
  (9, 'Special Shekla Tibs', 450.00, 2, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', 1),
  (10, 'Traditional Kitfo Special', 480.00, 2, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', 1),
  (11, 'Lamb Rogan Josh Curry', 480.00, 2, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', 1),
  (12, 'Seafood & Rice Paella', 550.00, 2, 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=600&q=80', 1),
  (13, 'Grilled Chicken Steak', 460.00, 2, 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80', 1),
  (14, 'Fish and Chips Platter', 380.00, 2, 'https://images.unsplash.com/photo-1579208030886-b937da0925dc?auto=format&fit=crop&w=600&q=80', 1),
  (15, 'Margherita Pizza', 320.00, 3, 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80', 1),
  (16, 'Chicken Supreme Pizza', 380.00, 3, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80', 1),
  (17, 'Four Cheese Pizza', 410.00, 3, 'https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=600&q=80', 1),
  (18, 'Spaghetti Carbonara', 340.00, 3, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80', 1),
  (19, 'Classic Lasagna Bolognese', 370.00, 3, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80', 1),
  (20, 'Chocolate Lava Cake', 220.00, 4, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80', 1),
  (21, 'Strawberry Cheesecake', 250.00, 4, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80', 1),
  (22, 'Classic Tiramisu Cup', 210.00, 4, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80', 1),
  (23, 'Vanilla Ice Cream Sundae', 160.00, 4, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80', 1),
  (24, 'Fresh Mango Juice', 110.00, 5, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80', 1),
  (25, 'Fresh Avocado Special Juice', 130.00, 5, 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=600&q=80', 1),
  (26, 'Iced Caramel Macchiato', 140.00, 5, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80', 1),
  (27, 'Mint Mojito Lemonade', 130.00, 5, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', 1),
  (28, 'Hot Cappuccino', 90.00, 5, 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80', 1),
  (29, 'Fresh Orange Juice', 120.00, 5, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80', 1),
  (33, 'Double Cheese Burger', 390.00, 2, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80', 1),
  (34, 'BBQ Bacon Burger', 420.00, 2, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80', 1),
  (35, 'Traditional Ethiopian Coffee (Jebena)', 80.00, 5, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', 1),
  (36, 'Espresso Single', 70.00, 5, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80', 1),
  (37, 'Caffe Latte', 100.00, 5, 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80', 1),
  (38, 'Chicken Burger', 350.00, 2, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd', 0)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price),
  category_id = VALUES(category_id),
  image_url = VALUES(image_url),
  is_available = VALUES(is_available);

ALTER TABLE categories AUTO_INCREMENT = 6;
ALTER TABLE menu AUTO_INCREMENT = 39;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE order_items AUTO_INCREMENT = 1;
