import db from '../config/db.js';

// Model Methods (Internal)
const getAll = async () => {
  await db.poolConnect;
  const result = await db.pool.request().query('SELECT * FROM Products');
  return result.recordset;
};

const getById = async (id) => {
  await db.poolConnect;
  const request = db.pool.request();
  request.input('id', db.sql.VarChar, id);

  const result = await request.query('SELECT * FROM Products WHERE ProductID = @id');
  return result.recordset.length > 0 ? result.recordset[0] : null;
};

const create = async (productData) => {
  await db.poolConnect;
  const request = db.pool.request();

  request.input('ProductID', db.sql.VarChar, productData.ProductID);
  request.input('ProductName', db.sql.NVarChar, productData.ProductName);
  request.input('Rate_per_Bag', db.sql.Decimal(10, 2), productData.Rate_per_Bag);
  request.input('Stock_bag', db.sql.Int, productData.Stock_bag);

  const result = await request.query(`
    INSERT INTO Products (ProductID, ProductName, Rate_per_Bag, Stock_bag)
    VALUES (@ProductID, @ProductName, @Rate_per_Bag, @Stock_bag)
  `);
  return result;
};

const update = async (id, productData) => {
  await db.poolConnect;
  const request = db.pool.request();

  request.input('id', db.sql.VarChar, id);
  request.input('ProductName', db.sql.NVarChar, productData.ProductName);
  request.input('Rate_per_Bag', db.sql.Decimal(10, 2), productData.Rate_per_Bag);
  request.input('Stock_bag', db.sql.Int, productData.Stock_bag);

  const result = await request.query(`
    UPDATE Products SET 
      ProductName = @ProductName, 
      Rate_per_Bag = @Rate_per_Bag, 
      Stock_bag = @Stock_bag
    WHERE ProductID = @id
  `);
  return result;
};

const updateStock = async (id, quantity) => {
  await db.poolConnect;
  const request = db.pool.request();

  request.input('id', db.sql.VarChar, id);
  request.input('qty', db.sql.Int, quantity);

  const result = await request.query(`
    UPDATE Products SET Stock_bag = Stock_bag - @qty
    WHERE ProductID = @id AND Stock_bag >= @qty
  `);

  if (result.rowsAffected[0] === 0) {
    throw new Error('Not enough stock available');
  }

  return result;
};

const deleteProductById = async (id) => {
  await db.poolConnect;
  const request = db.pool.request();
  request.input('id', db.sql.VarChar, id);

  const result = await request.query('DELETE FROM Products WHERE ProductID = @id');
  return result;
};

// --- Controller Functions ---
export const getAllProducts = async (req, res) => {
  try {
    const products = await getAll();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await getById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const requiredFields = ['ProductID', 'ProductName', 'Rate_per_Bag', 'Stock_bag'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    await create(req.body);
    res.status(201).json({ message: 'Product created successfully' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await getById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await update(req.params.id, req.body);
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

export const updateProductStock = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    const product = await getById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await updateStock(req.params.id, quantity);
    res.status(200).json({ message: 'Product stock updated successfully' });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ message: 'Error updating product stock', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await getById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await deleteProductById(req.params.id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};
