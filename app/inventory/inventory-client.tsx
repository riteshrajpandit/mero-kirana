"use client";

import { useMemo, useState } from "react";

import { MobileBottomNav } from "@/app/components/mobile-bottom-nav";

type ProductItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  priceRupees: number;
};

const INITIAL_PRODUCTS: ProductItem[] = [
  { id: "ww-01", name: "Wai Wai Noodles", category: "Snacks", unit: "packs", stock: 150, priceRupees: 20 },
  {
    id: "atta-5kg",
    name: "Aashirvaad Atta 5kg",
    category: "Staples",
    unit: "bags",
    stock: 3,
    priceRupees: 450,
  },
  { id: "milk-blue", name: "DDC Milk (Blue)", category: "Dairy", unit: "pkts", stock: 24, priceRupees: 45 },
  { id: "sugar-khulla", name: "Sugar (Khulla)", category: "Staples", unit: "kg", stock: 0, priceRupees: 110 },
  { id: "coke-2l", name: "Coca Cola 2L", category: "Beverages", unit: "btls", stock: 12, priceRupees: 220 },
];

type InventoryClientProps = {
  shopId: string;
};

function statusTone(stock: number) {
  if (stock <= 0) {
    return {
      label: "Out of stock",
      wrapper: "border-red-200/70 bg-red-50",
      text: "text-red-700",
    };
  }

  if (stock <= 5) {
    return {
      label: "Low stock",
      wrapper: "border-orange-200/70 bg-orange-50",
      text: "text-orange-700",
    };
  }

  return {
    label: "In stock",
    wrapper: "border-emerald-200/70 bg-emerald-50",
    text: "text-emerald-700",
  };
}

export default function InventoryClient({ shopId }: InventoryClientProps) {
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.id.toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  const lowStockCount = useMemo(() => {
    return products.filter((product) => product.stock > 0 && product.stock <= 5).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((product) => product.stock <= 0).length;
  }, [products]);

  const onAddProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const stockValue = Number(stock);
    const priceValue = Number(price);

    if (!trimmedName || !trimmedCategory || !Number.isFinite(stockValue) || !Number.isFinite(priceValue)) {
      return;
    }

    const product: ProductItem = {
      id: crypto.randomUUID().slice(0, 8),
      name: trimmedName,
      category: trimmedCategory,
      unit: unit.trim() || "pcs",
      stock: Math.max(0, Math.round(stockValue)),
      priceRupees: Math.max(0, Math.round(priceValue)),
    };

    setProducts((current) => [product, ...current]);
    setName("");
    setCategory("");
    setUnit("pcs");
    setStock("");
    setPrice("");
    setIsAddOpen(false);
  };

  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 pb-32 sm:px-6 lg:px-8">
        <section className="rounded-[1.8rem] border border-emerald-900/15 bg-gradient-to-br from-emerald-900 via-emerald-800 to-orange-600 p-5 text-white shadow-[0_26px_56px_-36px_rgba(7,33,18,0.7)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/75">Inventory</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Stock Control</h1>
              <p className="mt-1 text-sm text-white/80">Shop {shopId.slice(0, 8)} • {products.length} products</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOpen((open) => !open)}
              className="rounded-xl bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.1em] ring-1 ring-white/30"
            >
              {isAddOpen ? "Close" : "Add"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-sm">
            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-white/70">Low Stock</p>
              <p className="mt-1 text-2xl font-black">{lowStockCount}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-white/70">Out of Stock</p>
              <p className="mt-1 text-2xl font-black">{outOfStockCount}</p>
            </div>
          </div>
        </section>

        {isAddOpen ? (
          <section className="rounded-[1.4rem] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-600">Add Product</h2>
            <form onSubmit={onAddProduct} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                className="min-h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none ring-orange-300 transition focus:ring-2 sm:col-span-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Product name"
                required
              />
              <input
                className="min-h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none ring-orange-300 transition focus:ring-2"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Category"
                required
              />
              <input
                className="min-h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none ring-orange-300 transition focus:ring-2"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                placeholder="Unit (pcs, kg, pack)"
                required
              />
              <input
                className="min-h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none ring-orange-300 transition focus:ring-2"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                placeholder="Opening stock"
                inputMode="numeric"
                required
              />
              <input
                className="min-h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none ring-orange-300 transition focus:ring-2"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Price (Rs)"
                inputMode="numeric"
                required
              />
              <button
                type="submit"
                className="min-h-11 rounded-xl bg-zinc-900 px-4 text-sm font-black uppercase tracking-[0.08em] text-white sm:col-span-2"
              >
                Save Product
              </button>
            </form>
          </section>
        ) : null}

        <section className="rounded-[1.4rem] border border-zinc-200 bg-white p-4 shadow-sm">
          <input
            className="min-h-11 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none ring-emerald-300 transition focus:ring-2"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search inventory"
          />

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.length === 0 ? (
              <p className="rounded-xl bg-zinc-50 px-3 py-4 text-sm text-zinc-600 md:col-span-2 xl:col-span-3">
                No products found for this search.
              </p>
            ) : (
              filteredProducts.map((product) => {
                const status = statusTone(product.stock);

                return (
                  <article
                    key={product.id}
                    className={`rounded-xl border px-4 py-4 shadow-sm ${status.wrapper}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-zinc-900">{product.name}</p>
                        <p className="text-xs text-zinc-600">{product.category}</p>
                      </div>
                      <span className="rounded-full bg-white/85 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-zinc-600">
                        SKU {product.id}
                      </span>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-zinc-500">Price</p>
                        <p className="text-sm font-black text-zinc-900">Rs {product.priceRupees}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[11px] font-black uppercase tracking-[0.08em] ${status.text}`}>
                          {status.label}
                        </p>
                        <p className="text-lg font-black text-zinc-900">
                          {product.stock} {product.unit}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>

      <MobileBottomNav activeTab="inventory" />
    </>
  );
}
