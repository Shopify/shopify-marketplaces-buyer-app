import NextLink from "next/link";
import { Container, Grid, Link, Stack, Typography } from "@mui/material";

const ProductTile = ({
  handle,
  title,
  image,
  onlineStoreUrl,
  priceRange,
  shopId,
  showLinks
}) => {
  const imgProps = image
    ? { src: image.originalSrc, alt: image.altText }
    : {
        src:
          "https://cdn.shopify.com/shopifycloud/shopify/assets/no-image-2048-5e88c1b20e087fb7bbe9a3771824e743c244f437e4f8ba93bbf7b11b53f7824c_1024x.gif",
        alt: "",
      };
  const { amount, currencyCode } = priceRange.minVariantPrice;
  const formattedPrice = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currencyCode,
  }).format(priceRange.minVariantPrice.amount);
  const priceString = `${formattedPrice}${
    amount === priceRange.maxVariantPrice.amount ? "" : "+"
  }`;

  return (
    <Stack flexDirection="column">
      <NextLink href={`/products/${shopId}/${handle}`}>
        <Link href={`/products/${shopId}/${handle}`}>
          <Stack
            border="1px solid lightgrey"
            borderRadius="5px"
            overflow="hidden"
          >
            <img
              {...imgProps}
              style={{
                objectFit: "contain",
                height: "300px",
                maxWidth: "100%",
              }}
            />
          </Stack>
        </Link>
      </NextLink>
      <Stack spacing={1} mt={2} alignItems="start">
        <Typography variant="h3">{title}</Typography>
        <Typography variant="body2" component="span">
          {priceString}
        </Typography>
        {showLinks && <>
          <Link variant="button" href={onlineStoreUrl} target="_blank">
            View on online store
          </Link>
          <NextLink href={`/products/${shopId}/${handle}`}>
            <Link variant="button" href="">
              View Product Details
            </Link>
          </NextLink>
        </>}
      </Stack>
    </Stack>
  );
};

 const ProductGrid = ({ products, shopId, columns = 4, showLinks = true }) => {
   if (products.length === 0) {
    return (
      <Container m={2}>
        <Typography variant="body2" align="center">
          No products
        </Typography>
      </Container>
    );
  }
  return (
    <Grid container rowSpacing={6} columnSpacing={2} mb={2}>
      {products.map((product) => (
        <Grid key={product.id} item xs={12} sm={6} md={12 / columns}>
          <ProductTile
            {...product}
            image={product.images.edges[0] && product.images.edges[0].node}
            shopId={shopId}
            showLinks={showLinks}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProductGrid;