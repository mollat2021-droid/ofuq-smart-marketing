"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  title: string;
  description: string | null;
  product_url: string;
  category: string | null;
  created_at: string;
};

export default function ProductsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [category, setCategory] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editProductUrl, setEditProductUrl] = useState("");
  const [editCategory, setEditCategory] = useState("");

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("فشل تحميل المنتجات");
      console.log(error);
      return;
    }

    setProducts(data || []);
  }

  async function addProduct() {
    if (!title || !productUrl) {
      alert("أدخل اسم المنتج والرابط");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("products").insert([
      {
        title,
        description,
        product_url: productUrl,
        category,
      },
    ]);

    setLoading(false);

    if (error) {
      alert("فشل حفظ المنتج");
      console.log(error);
      return;
    }

    setTitle("");
    setDescription("");
    setProductUrl("");
    setCategory("");

    loadProducts();
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditTitle(product.title || "");
    setEditDescription(product.description || "");
    setEditProductUrl(product.product_url || "");
    setEditCategory(product.category || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditProductUrl("");
    setEditCategory("");
  }

  async function updateProduct() {
    if (!editingId) return;

    if (!editTitle || !editProductUrl) {
      alert("اسم المنتج والرابط مطلوبان");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("products")
      .update({
        title: editTitle,
        description: editDescription,
        product_url: editProductUrl,
        category: editCategory,
      })
      .eq("id", editingId);

    setLoading(false);

    if (error) {
      alert("فشل تعديل المنتج");
      console.log(error);
      return;
    }

    alert("تم تعديل المنتج بنجاح");
    cancelEdit();
    loadProducts();
  }

  async function deleteProduct(id: string) {
    const ok = confirm("هل تريد حذف هذا المنتج نهائيًا؟");
    if (!ok) return;

    setLoading(true);

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    setLoading(false);

    if (error) {
      alert("فشل حذف المنتج");
      console.log(error);
      return;
    }

    alert("تم حذف المنتج");
    loadProducts();
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">المنتجات</h1>

      <p className="mt-2 text-slate-600">
        إدارة المنتجات وروابط صفحات الهبوط أو الدفع.
      </p>

      <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm border">
        <h2 className="text-xl font-bold">إضافة منتج جديد</h2>

        <div className="mt-6 grid gap-4">
          <input
            className="rounded-xl border p-3"
            placeholder="اسم المنتج"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="rounded-xl border p-3"
            placeholder="وصف المنتج"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="rounded-xl border p-3"
            placeholder="رابط المنتج أو صفحة الهبوط"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
          />

          <input
            className="rounded-xl border p-3"
            placeholder="تصنيف المنتج"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <button
            onClick={addProduct}
            disabled={loading}
            className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50"
          >
            {loading ? "جاري التنفيذ..." : "حفظ المنتج"}
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-4">
        <h2 className="text-2xl font-bold">قائمة المنتجات</h2>

        {products.map((product) => {
          const isEditing = editingId === product.id;

          return (
            <div
              key={product.id}
              className="rounded-3xl bg-white p-6 shadow-sm border"
            >
              {isEditing ? (
                <div className="grid gap-4">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="rounded-xl border p-3"
                    placeholder="اسم المنتج"
                  />

                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="rounded-xl border p-3"
                    placeholder="وصف المنتج"
                  />

                  <input
                    value={editProductUrl}
                    onChange={(e) => setEditProductUrl(e.target.value)}
                    className="rounded-xl border p-3"
                    placeholder="رابط المنتج"
                  />

                  <input
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="rounded-xl border p-3"
                    placeholder="تصنيف المنتج"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={updateProduct}
                      disabled={loading}
                      className="rounded-xl bg-green-600 px-5 py-3 text-white disabled:opacity-50"
                    >
                      حفظ التعديل
                    </button>

                    <button
                      onClick={cancelEdit}
                      className="rounded-xl bg-slate-600 px-5 py-3 text-white"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{product.title}</h3>

                    <p className="mt-2 text-slate-600">
                      {product.description}
                    </p>

                    <p className="mt-2 text-sm text-blue-600">
                      {product.product_url}
                    </p>

                    {product.category && (
                      <span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm">
                        {product.category}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-2 min-w-32">
                    <button
                      onClick={() => startEdit(product)}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-white"
                    >
                      تعديل
                    </button>

                    <button
                      onClick={() => deleteProduct(product.id)}
                      disabled={loading}
                      className="rounded-xl bg-red-600 px-4 py-2 text-white disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}