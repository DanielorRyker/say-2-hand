import React from "react";
import { Icon } from "@iconify/react";
import { formatImageUrl } from "@/lib/constants";
import styles from "./SimilarProducts.module.scss";

interface SimilarProductsProps {
  products: any[];
  cardFavorites: Record<number, boolean>;
  onToggleCardFavorite: (id: number) => void;
  createRipple: (e: React.MouseEvent, btn?: HTMLElement) => void;
  formatCurrency: (n: number) => string;
}

const SimilarProducts: React.FC<SimilarProductsProps> = ({
  products,
  cardFavorites,
  onToggleCardFavorite,
  createRipple,
  formatCurrency,
}) => {
  return (
    <section className={`${styles["similar-section"]}`}>
      <h2 className={`${styles["heading-pt"]}`}>Khám Phá Thêm Gần Bạn</h2>
      <div className={`${styles["similar-grid"]}`} id="similar-products">
        {products.map((product: any) => {
          const isFree = product.transaction_type === "Miễn phí";
          const isTrade = product.transaction_type === "Trao đổi";
          const isNewCond = /99%|100%|Mới/.test(product.condition || "");

          return (
            <a
              key={product.id}
              href="#"
              className={`${styles["similar-product-card"]}`}
            >
              <button
                className={`${styles["sp-fav-btn"]} ${styles["ripple-target"]}`}
                aria-label={`Yêu thích ${product.title}`}
                onClick={(e) => {
                  createRipple(e as any);
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleCardFavorite(product.id);
                }}
              >
                <span
                  className={`${styles["heartIcon"]} ${
                    cardFavorites[product.id]
                      ? styles["heartIconActive"]
                      : ""
                  }`}
                >
                  <Icon
                    icon={
                      cardFavorites[product.id]
                        ? "ic:sharp-favorite"
                        : "ic:twotone-favorite"
                    }
                    width={20}
                    height={20}
                  />
                </span>
              </button>

              <div className={`${styles["product-aspect"]}`}>
                <img
                  src={formatImageUrl(product.img)}
                  alt={product.title}
                />
              </div>

              <div className={`${styles["card-body"]}`}>
                <h4 className={`${styles["sp-title"]}`}>{product.title}</h4>

                <div className={`${styles["chips"]}`}>
                  <span
                    className={`${styles["chip"]} ${styles["condition"]} ${
                      isNewCond ? `${styles["condition-new"]}` : ""
                    }`}
                  >
                    {(product.condition || "").split("(")[0].trim()}
                  </span>
                  {isFree ? (
                    <span
                      className={`${styles["chip"]} ${styles["exchange"]} ${styles["exchange-free"]}`}
                    >
                      Cho Tặng
                    </span>
                  ) : isTrade ? (
                    <span
                      className={`${styles["chip"]} ${styles["exchange"]} ${styles["exchange-trade"]}`}
                    >
                      Trao Đổi
                    </span>
                  ) : (
                    <span
                      className={`${styles["chip"]} ${styles["exchange"]} ${styles["exchange-sell"]}`}
                    >
                      Rao Bán
                    </span>
                  )}
                </div>

                <div className={`${styles["price-seller-col"]}`}>
                  <div className={`${styles["price-section"]}`}>
                    {isFree ? (
                      <span className={`${styles["price-free"]}`}>
                        MIỄN PHÍ
                      </span>
                    ) : isTrade ? (
                      <span className={`${styles["price-trade"]}`}>
                        TRAO ĐỔI
                      </span>
                    ) : (
                      <span className={`${styles["price-value"]}`}>
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>

                  <div className={`${styles["seller-small"]}`}>
                    <div className={`${styles["seller-avatar"]}`}>
                      <img
                        src={formatImageUrl(product.seller.avatar)}
                        alt={product.seller.name}
                      />
                    </div>

                    <div className={`${styles["seller-meta-small"]}`}>
                      <div className={`${styles["seller-name-small"]}`}>
                        {product.seller.name}
                      </div>
                      {product.seller.rating !== undefined && (
                        <div
                          className={`${styles["seller-rating-badge"]}`}
                          title={`Đánh giá: ${product.seller.rating}`}
                        >
                          <Icon
                            icon="lucide:star"
                            width={12}
                            height={12}
                          />
                          &nbsp;{product.seller.rating.toFixed(1)}
                        </div>
                      )}
                    </div>

                    {product.seller.distance_km !== undefined && (
                      <div
                        className={`${styles["seller-distance"]}`}
                        title={`Khoảng cách: ${product.seller.distance_km} km`}
                      >
                        {product.seller.distance_km.toFixed(1)} km
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
};

export default SimilarProducts;
