"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CollectionRecord, ProductRecord } from "@/types/database";
import { ProductCard } from "@/components/ProductCard";

export function CatalogExplorer({
  collections,
  products
}: {
  collections: CollectionRecord[];
  products: ProductRecord[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCollection = searchParams.get("collection") ?? "all";
  const initialQuery = searchParams.get("q") ?? "";
  const initialSort = searchParams.get("sort") ?? "featured";

  const [activeCollection, setActiveCollection] = useState(initialCollection);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState(initialSort);

  useEffect(() => {
    setActiveCollection(searchParams.get("collection") ?? "all");
    setSearchQuery(searchParams.get("q") ?? "");
    setSortBy(searchParams.get("sort") ?? "featured");
  }, [searchParams]);

  const hasAnyPrices = useMemo(
    () => products.some((p) => typeof p.price_amount === "number" && p.price_amount > 0),
    [products]
  );

  const updateUrlParams = (nextCol: string, nextQ: string, nextSort: string) => {
    const params = new URLSearchParams();
    if (nextCol && nextCol !== "all") params.set("collection", nextCol);
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextSort && nextSort !== "featured") params.set("sort", nextSort);
    const qs = params.toString();
    router.replace(qs ? `/catalog?${qs}` : "/catalog", { scroll: false });
  };

  const handleCollectionSelect = (slug: string) => {
    setActiveCollection(slug);
    updateUrlParams(slug, searchQuery, sortBy);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateUrlParams(activeCollection, value, sortBy);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateUrlParams(activeCollection, searchQuery, value);
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((item) => {
      const colMatch =
        activeCollection === "all" ||
        item.collection?.slug === activeCollection ||
        item.collection_id === activeCollection;
      if (!colMatch) return false;
      if (!q) return true;

      const haystack = [
        item.name,
        item.reference_code,
        item.collection?.name,
        item.short_description,
        item.description
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });

    return [...list].sort((a, b) => {
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name_desc") {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "price_asc" && hasAnyPrices) {
        return (a.price_amount ?? Number.MAX_SAFE_INTEGER) - (b.price_amount ?? Number.MAX_SAFE_INTEGER);
      }
      if (sortBy === "price_desc" && hasAnyPrices) {
        return (b.price_amount ?? 0) - (a.price_amount ?? 0);
      }
      // Default: featured & sort_order
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.sort_order - b.sort_order;
    });
  }, [products, activeCollection, searchQuery, sortBy, hasAnyPrices]);

  return (
    <div>
      {/* Filter & Search Bar */}
      <div className="mb-10 rounded-xl border border-gold/25 bg-charcoal p-5 shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Collection Filter Pills */}
          <div
            role="group"
            aria-label="Filter timepieces by collection"
            className="flex flex-wrap gap-2"
          >
            <button
              type="button"
              onClick={() => handleCollectionSelect("all")}
              aria-pressed={activeCollection === "all"}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.12em] transition ${
                activeCollection === "all"
                  ? "border-transparent bg-gold font-semibold text-obsidian"
                  : "border-gold/25 bg-surface text-cream-secondary hover:border-gold"
              }`}
            >
              All Collections
            </button>
            {collections.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => handleCollectionSelect(col.slug)}
                aria-pressed={activeCollection === col.slug}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.12em] transition ${
                  activeCollection === col.slug
                    ? "border-transparent bg-gold font-semibold text-obsidian"
                    : "border-gold/25 bg-surface text-cream-secondary hover:border-gold"
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:w-64">
              <label htmlFor="catalog-search-input" className="sr-only">
                Search timepieces
              </label>
              <input
                id="catalog-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or collection..."
                className="w-full rounded border border-gold/30 bg-surface px-3.5 py-2 text-sm text-cream placeholder:text-cream-muted focus:border-gold-bright"
              />
            </div>

            <div>
              <label htmlFor="catalog-sort-select" className="sr-only">
                Sort timepieces
              </label>
              <select
                id="catalog-sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full rounded border border-gold/30 bg-surface px-3.5 py-2 text-sm text-cream focus:border-gold-bright sm:w-auto"
              >
                <option value="featured">Curated Order</option>
                <option value="newest">Newest Arrivals</option>
                <option value="name_asc">Name (A – Z)</option>
                <option value="name_desc">Name (Z – A)</option>
                {hasAnyPrices && <option value="price_asc">Price (Low to High)</option>}
                {hasAnyPrices && <option value="price_desc">Price (High to Low)</option>}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Count Status */}
      <div className="mb-6 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-gold">
        <p aria-live="polite">
          Showing {filteredProducts.length} of {products.length} Timepieces
        </p>
        {(activeCollection !== "all" || searchQuery.trim() !== "") && (
          <button
            type="button"
            onClick={() => {
              setActiveCollection("all");
              setSearchQuery("");
              setSortBy("featured");
              router.replace("/catalog", { scroll: false });
            }}
            className="underline decoration-gold/50 underline-offset-4 hover:text-gold-bright"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Responsive Product Grid or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gold/30 bg-charcoal px-6 py-16 text-center">
          <h2 className="font-serif text-2xl text-cream">No Matching Timepieces</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-cream-secondary">
            No timepieces matched your current filter or search criteria. Try clearing your filter or contact our concierge for bespoke assistance.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCollection("all");
              setSearchQuery("");
              router.replace("/catalog", { scroll: false });
            }}
            className="mt-6 inline-flex rounded border border-gold/50 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold-bright transition hover:bg-gold hover:text-obsidian"
          >
            View All Timepieces
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
