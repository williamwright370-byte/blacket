import { ImageOrVideo } from "@components/index";
import { useResource } from "@stores/ResourceStore/index";
import { useData } from "@stores/DataStore/index";
import Textfit from "react-textfit";
import styles from "../store.module.scss";

import { ProductProps } from "../store.d";
import Price from "./Price";

export default function Product({ product, ...props }: ProductProps) {
    const { resourceIdToPath } = useResource();
    const { fontIdToName } = useData();

    return (
        <div className={styles.product} style={{ background: `linear-gradient(15deg, ${product.color1}, ${product.color2})` }} {...props}>
            {product.tag && (
                <div className={styles.cornerRibbon}>
                    <Textfit
                        mode="multi"
                        min={5}
                        max={16}
                        className={styles.cornerRibbonContent}
                    >
                        {product.tag}
                    </Textfit>
                </div>
            )}

            <div
                className={styles.productTop}
                style={product.tag ? {
                    marginRight: 55,
                    transform: "scale(0.85)"
                } : {}}
            >
                <Textfit
                    mode="single"
                    min={1}
                    max={25}
                    className={styles.productTitle}
                    style={{
                        fontFamily: product.fontId ? fontIdToName(product.fontId) : ""
                    }}
                >
                    {product.name}
                </Textfit>

                {product.subname && <Textfit
                    mode="single"
                    min={1}
                    max={15}
                    className={styles.productSubtitle}
                >
                    {product.subname}
                </Textfit>}
            </div>

            <div className={styles.productImageContainer}>
                <ImageOrVideo className={styles.productImage} src={resourceIdToPath(product.imageId)} draggable={false} />
                <div className={styles.productShadow} />
                {/* <ImageOrVideo className={styles.productShadow} src={resourceIdToPath(product.imageId)} draggable={false} /> */}
            </div>

            <div className={styles.productBottom}>
                {!product.isSubscription
                    ? <>
                        {product.discount ? <>
                            <Price price={product.price} isSubPrice={true} isPriceUsingCrystals={product.isPriceUsingCrystals} strikethrough />
                            <Price price={product.price} discount={product.discount} isPriceUsingCrystals={product.isPriceUsingCrystals} />
                        </> : <Price price={product.price} isPriceUsingCrystals={product.isPriceUsingCrystals} />}

                        {product.subtag && <div className={styles.productSubTag}>
                            <i className="fa-solid fa-sparkle" />
                            {product.subtag}
                        </div>}
                    </>
                    : <>
                        <div className={styles.productPrice}>
                            ${product.subscriptionPrice} USD monthly
                        </div>
                        {(product.price > 0) && <div className={styles.productSubPrice}>
                            ${product.price} USD lifetime
                        </div>}
                    </>
                }
            </div>

            {Array.from({ length: 3 }, (_, i) => <div key={i} className={styles.shine} />)}
        </div >
    );
}
