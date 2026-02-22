import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("stm_engineering.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    passport_number TEXT,
    address TEXT,
    insurance_details TEXT,
    insurance_expiry DATE,
    visa_details TEXT,
    visa_expiry DATE,
    base_salary REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    date DATE DEFAULT CURRENT_DATE,
    hours_worked REAL,
    location TEXT,
    role TEXT,
    clock_in_time TEXT,
    clock_out_time TEXT,
    before_image TEXT,
    after_image TEXT,
    status TEXT DEFAULT 'pending',
    work_description TEXT,
    FOREIGN KEY(employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS salary_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    amount REAL,
    payment_date DATE DEFAULT CURRENT_DATE,
    month INTEGER,
    year INTEGER,
    FOREIGN KEY(employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    customer_name TEXT,
    amount REAL,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY(employee_id) REFERENCES employees(id)
  );
`);

// Migration: Add new columns if they don't exist
const migrations = [
  "ALTER TABLE employees ADD COLUMN is_active INTEGER DEFAULT 1",
  "ALTER TABLE employees ADD COLUMN username TEXT UNIQUE",
  "ALTER TABLE employees ADD COLUMN password TEXT",
  "ALTER TABLE attendance ADD COLUMN role TEXT",
  "ALTER TABLE attendance ADD COLUMN clock_in_time TEXT",
  "ALTER TABLE attendance ADD COLUMN clock_out_time TEXT",
  "ALTER TABLE attendance ADD COLUMN before_image TEXT",
  "ALTER TABLE attendance ADD COLUMN after_image TEXT",
  "ALTER TABLE attendance ADD COLUMN status TEXT DEFAULT 'pending'",
  "ALTER TABLE attendance ADD COLUMN work_description TEXT"
];

migrations.forEach(m => {
  try {
    db.prepare(m).run();
  } catch (e) {}
});

// Seed data if empty
const employeeCount = db.prepare("SELECT COUNT(*) as count FROM employees").get() as { count: number };
if (employeeCount.count === 0) {
  const insertEmployee = db.prepare(`
    INSERT INTO employees (name, passport_number, address, insurance_details, insurance_expiry, visa_details, visa_expiry, base_salary, is_active, username, password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  
  insertEmployee.run("John Doe", "E1234567", "123 Jurong East, Singapore", "AIA Health Plus", "2026-03-01", "Work Permit", "2026-02-25", 3500, "john", "john123");
  insertEmployee.run("Jane Smith", "E7654321", "456 Tampines St, Singapore", "Prudential Life", "2026-05-15", "S-Pass", "2027-01-10", 4200, "jane", "jane123");
  insertEmployee.run("Ali Hassan", "E9988776", "789 Woodlands Dr, Singapore", "Great Eastern", "2026-02-22", "Work Permit", "2026-02-23", 2800, "ali", "ali123");
}

// Seed admin user independently
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", "admin123");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Route
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    // Check admin
    const admin = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (admin) {
      return res.json({ success: true, user: { username: (admin as any).username, role: 'admin' } });
    }

    // Check employee
    const employee = db.prepare("SELECT * FROM employees WHERE username = ? AND password = ? AND is_active = 1").get(username, password);
    if (employee) {
      return res.json({ success: true, user: { id: (employee as any).id, name: (employee as any).name, username: (employee as any).username, role: 'employee' } });
    }

    res.status(401).json({ success: false, message: "Invalid credentials" });
  });

  // API Routes
  app.get("/api/employees", (req, res) => {
    const { active } = req.query;
    let query = "SELECT * FROM employees";
    const params: any[] = [];
    
    if (active !== undefined) {
      query += " WHERE is_active = ?";
      params.push(active === 'true' ? 1 : 0);
    }
    
    const employees = db.prepare(query).all(...params);
    res.json(employees);
  });

  app.post("/api/employees", (req, res) => {
    const { name, passport_number, address, insurance_details, insurance_expiry, visa_details, visa_expiry, base_salary, username, password } = req.body;
    const info = db.prepare(`
      INSERT INTO employees (name, passport_number, address, insurance_details, insurance_expiry, visa_details, visa_expiry, base_salary, is_active, username, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(name, passport_number, address, insurance_details, insurance_expiry, visa_details, visa_expiry, base_salary, username, password);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/employees/:id", (req, res) => {
    const { id } = req.params;
    const { name, passport_number, address, insurance_details, insurance_expiry, visa_details, visa_expiry, base_salary, is_active, username, password } = req.body;
    db.prepare(`
      UPDATE employees 
      SET name = ?, passport_number = ?, address = ?, insurance_details = ?, insurance_expiry = ?, visa_details = ?, visa_expiry = ?, base_salary = ?, is_active = ?, username = ?, password = ?
      WHERE id = ?
    `).run(name, passport_number, address, insurance_details, insurance_expiry, visa_details, visa_expiry, base_salary, is_active ?? 1, username, password, id);
    res.json({ success: true });
  });

  app.get("/api/attendance", (req, res) => {
    const { employee_id } = req.query;
    let query = `
      SELECT a.*, e.name as employee_name 
      FROM attendance a 
      JOIN employees e ON a.employee_id = e.id
    `;
    const params: any[] = [];
    if (employee_id) {
      query += " WHERE a.employee_id = ?";
      params.push(employee_id);
    }
    query += " ORDER BY a.date DESC, a.id DESC";
    const attendance = db.prepare(query).all(...params);
    res.json(attendance);
  });

  app.post("/api/attendance/clock-in", (req, res) => {
    const { employee_id, date, location, role, clock_in_time, before_image, work_description } = req.body;
    const info = db.prepare(`
      INSERT INTO attendance (employee_id, date, location, role, clock_in_time, before_image, work_description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(employee_id, date, location, role, clock_in_time, before_image, work_description);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/attendance/clock-out", (req, res) => {
    const { id, clock_out_time, after_image, hours_worked } = req.body;
    db.prepare(`
      UPDATE attendance 
      SET clock_out_time = ?, after_image = ?, hours_worked = ?
      WHERE id = ?
    `).run(clock_out_time, after_image, hours_worked, id);
    res.json({ success: true });
  });

  app.put("/api/attendance/:id/approve", (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE attendance SET status = 'approved' WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Invoices
  app.get("/api/invoices", (req, res) => {
    const { employee_id } = req.query;
    let query = `
      SELECT i.*, e.name as employee_name 
      FROM invoices i
      JOIN employees e ON i.employee_id = e.id
    `;
    const params: any[] = [];
    if (employee_id) {
      query += " WHERE i.employee_id = ?";
      params.push(employee_id);
    }
    query += " ORDER BY i.date DESC";
    const invoices = db.prepare(query).all(...params);
    res.json(invoices);
  });

  app.post("/api/invoices", (req, res) => {
    const { employee_id, customer_name, amount, description, date } = req.body;
    const info = db.prepare(`
      INSERT INTO invoices (employee_id, customer_name, amount, description, date, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(employee_id, customer_name, amount, description, date);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/invoices/:id/approve", (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE invoices SET status = 'approved' WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/monthly-hours", (req, res) => {
    const { month, year } = req.query;
    const stats = db.prepare(`
      SELECT e.name as employee_name, SUM(a.hours_worked) as total_hours
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE strftime('%m', a.date) = ? AND strftime('%Y', a.date) = ? AND e.is_active = 1
      GROUP BY e.id
    `).all(month, year);
    res.json(stats);
  });

  app.get("/api/salary", (req, res) => {
    const salary = db.prepare(`
      SELECT s.*, e.name as employee_name 
      FROM salary_payments s 
      JOIN employees e ON s.employee_id = e.id
      ORDER BY s.payment_date DESC
    `).all();
    res.json(salary);
  });

  app.post("/api/salary", (req, res) => {
    const { employee_id, amount, month, year } = req.body;
    const info = db.prepare(`
      INSERT INTO salary_payments (employee_id, amount, month, year)
      VALUES (?, ?, ?, ?)
    `).run(employee_id, amount, month, year);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/notifications", (req, res) => {
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);
    
    const todayStr = today.toISOString().split('T')[0];
    const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];

    const visaExpiries = db.prepare(`
      SELECT id, name, visa_expiry as expiry_date, 'Visa' as type
      FROM employees 
      WHERE visa_expiry <= ? AND visa_expiry >= ? AND is_active = 1
    `).all(threeDaysLaterStr, todayStr);

    const insuranceExpiries = db.prepare(`
      SELECT id, name, insurance_expiry as expiry_date, 'Insurance' as type
      FROM employees 
      WHERE insurance_expiry <= ? AND insurance_expiry >= ? AND is_active = 1
    `).all(threeDaysLaterStr, todayStr);

    res.json([...visaExpiries, ...insuranceExpiries]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
