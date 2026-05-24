"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProductsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [category, setCategory] = useState("");

  const [products, setProducts] = useState<any[]>([]);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setProducts(data);
  }

  async function addProduct() {
    if (!title || !productUrl) {
      alert("أدخل اسم المنتج والرابط");
      return;
    }

    const { error } = await supabase
      .from("products")
      .insert([
        {
          title,
          description,
          product_url: productUrl,
          category,
        },
      ]);

    if (error) {
      console.log(error);
      alert("حدث خطأ");
      return;
    }

    setTitle("");
    setDescription("");
    setProductUrl("");
    setCategory("");

    loadProducts();
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div>

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-4xl font-bold">
            المنتجات
          </h1>

          <p className="mt-2 text-slate-600">
            إدارة المنتجات وربطها بالحملات.
          </p>
        </div>

      </div>

      {/* Form */}

      <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm border">

        <h2 className="text-2xl font-bold">
          إضافة منتج جديد
        </h2>

        <div className="mt-6 grid gap-4">

          <input
            className="rounded-xl border p-4"
            placeholder="اسم المنتج"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="rounded-xl border p-4"
            placeholder="وصف المنتج"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="rounded-xl border p-4"
            placeholder="رابط المنتج"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
          />

          <input
            className="rounded-xl border p-4"
            placeholder="التصنيف"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <button
            onClick={addProduct}
            className="rounded-xl bg-slate-900 px-5 py-4 text-white"
          >
            حفظ المنتج
          </button>

        </div>

      </div>

      {/* Products */}

      <div className="mt-10 grid gap-5">

        {products.map((product) => (

          <div
            key={product.id}
            className="rounded-3xl bg-white p-6 shadow-sm border"
          >

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold">
                  {product.title}
                </h2>

                <p className="mt-2 text-slate-600">
                  {product.description}
                </p>

                <p className="mt-4 text-sm text-blue-600">
                  {product.product_url}
                </p>

              </div>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm">
                {product.category}
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}