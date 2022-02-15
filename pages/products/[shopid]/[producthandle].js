import {
  Box,
  Button,
  Container,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
  Divider
} from "@mui/material";
import ApolloClient, { gql, InMemoryCache } from "apollo-boost";
import DOMPurify from "dompurify";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useApolloClient } from "react-apollo";
import { Page, ProductGrid } from "../../../components";
import { addToCart, addToCartAndCheckout } from "../../../helpers/cartHelpers";

const SHOP_QUERY = gql`
  query Shop($id: Int!) {
    shop(id: $id) {
      id
      domain
      storefrontAccessToken
    }
  }
`;

const PRODUCT_PAGE_QUERY = gql`
  query getProductPageData($productHandle: String!) {
    product(handle: $productHandle) {
      id
      title
      description
      productType
      tags
      vendor
      options(first: 100) {
        id
        name
        values
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            priceV2 {
              amount
              currencyCode
            }
            image {
              originalSrc
              altText
            }
            availableForSale
            selectedOptions {
              name
              value
            }
          }
        }
      }
      images(first: 10) {
        edges {
          node {
            originalSrc
            altText
          }
        }
      }
    }
    shop {
      privacyPolicy {
        body
      }
      refundPolicy {
        body
      }
      shippingPolicy {
        body
      }
      termsOfService {
        body
      }
    }
  }
`;

const RECOMMENDATIONS_QUERY = gql`
  query getRecommendations($productId: ID!) {
    productRecommendations(productId: $productId) {
      id
      handle
      title
      images(first: 1) {
        edges {
          node {
            id
            altText
            originalSrc
          }
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
};

const MainTabPanel = ({ tabValue, index, body }) => {
  return (
    <TabPanel value={tabValue} index={index}>
      <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }} />
    </TabPanel>
  );
};

const Product = () => {
  const router = useRouter();
  const { producthandle: productHandle, shopid: shopId } = router.query;
  const [data, setData] = useState(null);
  const [product, setProduct] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState(null);
  const [shopClient, setShopClient] = useState(null);
  const [shopDetails, setShopDetails] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [variant, setVariant] = useState(null);

  const client = useApolloClient();

  useEffect(() => {
    async function fetchData(id) {
      const { data } = await client.query({
        query: SHOP_QUERY,
        variables: {
          id: parseInt(id, 10),
        },
      });

      const shopGQLClient = new ApolloClient({
        uri: `https://${data.shop.domain}/api/2021-10/graphql.json`,
        headers: {
          "X-Shopify-Storefront-Access-Token": data.shop.storefrontAccessToken,
        },
        cache: new InMemoryCache(),
      });

      setData(data);
      setShopClient(shopGQLClient);
    }
    if (!data) {
      fetchData(shopId);
    }
  }, [shopId]);

  useEffect(() => {
    async function fetchData(shopClient) {
      const variables = {
        productHandle,
      };
      const { data } = await shopClient.query({
        query: PRODUCT_PAGE_QUERY,
        variables,
      });
      setProduct(data?.product);
      setShopDetails(data?.shop);
    }

    if (shopClient) {
      fetchData(shopClient);
    }
  }, [data, shopClient, productHandle]);

  useEffect(() => {
    async function fetchData(productId) {
      const variables = { productId };
      const { data } = await shopClient.query({
        query: RECOMMENDATIONS_QUERY,
        variables,
      });

      if (Array.isArray(data?.productRecommendations)) {
        setRecommendedProducts(data.productRecommendations.slice(0, 4));
      }
    }

    if (product?.id) {
      fetchData(product.id);
    }
  }, [product])

  useEffect(() => {
    if (!product) return;
    const firstVariant = product ? product.variants.edges[0].node : null;
    const firstVariantOptions = firstVariant.selectedOptions.reduce(
      (options, option) => {
        options[option.name] = option.value;
        return options;
      },
      {}
    );
    setVariant(firstVariant);
    setSelectedOptions(firstVariantOptions);
  }, [product]);

  const optionsList = useMemo(() => {
    const options = product ? product.options : [];

    return options.map((option) => {
      const valuesDict = option.values.map((val) => ({
        label: val,
        value: val,
      }));
      return {
        optionName: option.name,
        options: valuesDict,
      };
    });
  }, [product]);

  const addToCartClick = () => {
    addToCart(variant.id, data.shop.domain, shopClient);
  };

  const buyNow = async () => {
    addToCartAndCheckout(variant.id, data.shop.domain, shopClient);
  };

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  const setSpecificProductOption = (optionName, option) => {
    const newOptionsMap = {
      ...selectedOptions,
      [optionName]: option,
    };

    setSelectedOptions(newOptionsMap);
    const foundVariant = findVariantByOptions(newOptionsMap);
    setVariant(foundVariant.node);
  };

  if (!product) {
    return (
      <Page>
        <Container maxWidth="xl">
          <Typography variant="h3" component="div" textAlign="center" pt={2}>
            Loading
          </Typography>
        </Container>
      </Page>
    );
  }

  const optionsSelectList = optionsList.map((option) => {
    return (
      <div
        key={option.optionName}
        style={{
          marginTop: "30px",
        }}
      >
        <Typography variant="caption" component="div">
          {option.optionName}
        </Typography>
        <FormControl style={{ top: "20%", minWidth: "100px" }}>
          <Select
            labelId={`select-${option.optionName}-label`}
            id={`select${option.optionName}`}
            value={
              selectedOptions
                ? selectedOptions[option.optionName]
                : option.options[0].value
            }
            onChange={(e) =>
              setSpecificProductOption(option.optionName, e.target.value)
            }
          >
            {option.options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    );
  });

  const compareOptions = (variantOptions, currentOptions) => {
    for (let i = 0; i < variantOptions.length; i++) {
      const option = variantOptions[i];
      if (option.value !== currentOptions[option.name]) {
        return false;
      }
    }
    return true;
  };

  const variants = product.variants.edges;

  const findVariantByOptions = (options) => {
    return variants.find((item) =>
      compareOptions(item.node.selectedOptions, options)
    );
  };

  let image = product.images.edges[0].node;
  let price = "";

  if (variant) {
    image = variant.image;
    price = new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: variant.priceV2.currencyCode,
    }).format(variant.priceV2.amount);
  }

  const imgProps = image
    ? { src: image.originalSrc, alt: image.altText }
    : {
        src:
          "https://cdn.shopify.com/shopifycloud/shopify/assets/no-image-2048-5e88c1b20e087fb7bbe9a3771824e743c244f437e4f8ba93bbf7b11b53f7824c_1024x.gif",
        alt: "",
      };

  return (
    <Page>
      <Container style={{ marginTop: "150px" }}>
        <Box sx={{ display: "flex" }}>
          <Container style={{ paddingLeft: "0px" }}>
            <img
              {...imgProps}
              style={{
                objectFit: "contain",
                maxHeight: "590px",
                maxWidth: "500px",
              }}
            />
          </Container>
          <Container>
            <Typography variant="h1">{product.title}</Typography>
            <Typography variant="subtitle1" component="span">
              {price}
            </Typography>
            {optionsSelectList}
            <Stack mt={5} spacing={2} direction="row">
              <Button
                disabled={!variant || !data}
                onClick={addToCartClick}
                variant="outlined"
                sx={{ height: "56px", width: "208px" }}
              >
                ADD TO CART
              </Button>

              <Button
                disabled={!variant || !data}
                onClick={buyNow}
                sx={{ height: "56px", width: "208px" }}
                variant="contained"
              >
                BUY NOW
              </Button>
            </Stack>
          </Container>
        </Box>
      </Container>
      <Container>
        <Box sx={{ mt: 8, borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="tabs">
            <Tab label="SPECIFICATIONS" />
            {shopDetails?.refundPolicy && (
              <Tab label="RETURN POLICY" />
            )}
            {shopDetails?.shippingPolicy && (
              <Tab label="SHIPPING AND DELIVERY" />
            )}
            {shopDetails?.termsOfService && (
              <Tab label="TERMS OF SERVICE" />
            )}
            {shopDetails?.privacyPolicy && (
              <Tab label="PRIVACY POLICY" />
            )}
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          {product.description}
        </TabPanel>
        {shopDetails?.refundPolicy && (
          <MainTabPanel
            tabValue={tabValue}
            index={1}
            body={shopDetails.refundPolicy.body}
          />
        )}
        {shopDetails?.shippingPolicy && (
          <MainTabPanel
            tabValue={tabValue}
            index={2}
            body={shopDetails.shippingPolicy.body}
          />
        )}
        {shopDetails?.termsOfService && (
          <MainTabPanel
            tabValue={tabValue}
            index={3}
            body={shopDetails.termsOfService.body}
          />
        )}
        {shopDetails?.privacyPolicy && (
          <MainTabPanel
            tabValue={tabValue}
            index={4}
            body={shopDetails.privacyPolicy.body}
          />
        )}
      </Container>
      {recommendedProducts?.length > 0 && <Container maxWidth="xl">
        <Divider />
        <Typography variant="h2" mt={6} mb={4}>YOU MAY ALSO LIKE</Typography>
        <ProductGrid products={recommendedProducts} shopId={shopId} showLinks={false} />
      </Container>}
    </Page>
  );
};

export default Product;