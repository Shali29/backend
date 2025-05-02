import db from '../config/db.js';

// Product Model Methods - Internal functions
const getAll = async () => {
  try {
    const [rows] = await db.query('SELECT * FROM Products');
    return rows;
  } catch (error) {
    throw error;
  }
};

const getById = async (id) => {
  try {
    const [rows] = await db.query('SELECT * FROM Products WHERE ProductID = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

const create = async (productData) => {
  try {
    const query = `
      INSERT INTO Products (ProductID, ProductName, Rate_per_Bag, Stock_bag)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      productData.ProductID,
      productData.ProductName,
      productData.Rate_per_Bag,
      productData.Stock_bag
    ]);
    return result;
  } catch (error) {
    throw error;
  }
};

const update = async (id, productData) => {
  try {
    const query = `
      UPDATE Products SET 
        ProductName = ?, 
        Rate_per_Bag = ?, 
        Stock_bag = ?
      WHERE ProductID = ?
    `;
    const [result] = await db.query(query, [
      productData.ProductName,
      productData.Rate_per_Bag,
      productData.Stock_bag,
      id
    ]);
    return result;
  } catch (error) {
    throw error;
  }
};

const updateStock = async (id, quantity) => {
  try {
    const query = `
      UPDATE Products SET 
        Stock_bag = Stock_bag - ?
      WHERE ProductID = ? AND Stock_bag >= ?
    `;
    const [result] = await db.query(query, [quantity, id, quantity]);

    if (result.affectedRows === 0) {
      throw new Error('Not enough stock available');
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const deleteProductById = async (id) => {
  try {
    const [result] = await db.query('DELETE FROM Products WHERE ProductID = ?', [id]);
    return result;
  } catch (error) {
    throw error;
  }
};

// Controller functions - Exported for routes
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