import express, { Request, Response } from "express";
import Product from "../models/Product";
import { requireAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";
const router = express.Router();

// GET all products
router.get("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    const products = await Product.find({});
    console.log(products);
    res.status(200).json(products);
    return;
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
    return;
  }
});

// POST - Create a new product
router.post("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { name, description, price, sellerId, category } = req.body;
    console.log(req.body);
    if (!name || !description || !price || !category || !sellerId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const newProduct = new Product({
      name,
      description,
      price,
      seller: sellerId,
      category,
    });

    await newProduct.save();

    res.status(201).json({ message: "Product created successfully" });
    return;
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ error: "Failed to create product" });
    return;
  }
});

router.get("/:id", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    console.log(product);
    const Sellername = await clerkClient.users.getUser(product.seller);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.status(200).json({ product, Sellername });
    return;
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
    return;
  }
});

router.delete("/:id", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.status(200).json({ message: "Product deleted successfully" });
    return;
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product" });
    return;
  }
});
router.patch("/:id", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    const product = await Product.findById(id);

    const Sellername = await clerkClient.users.getUser(product.seller);
    res.status(200).json({ updatedProduct, Sellername });
  } catch {
    res.status(500).json({ error: "Error processing request" });
    return;
  }
});
router.post("/bulk", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { productIds } = req.body;
    console.log(productIds);
    if (!productIds || !Array.isArray(productIds)) {
      res.status(400).json({ error: "Invalid product IDs" });
      return;
    }

    // Fetch all products matching the given IDs
    const products = await Product.find({ _id: { $in: productIds } });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching products" });
  }
});

export default router;
