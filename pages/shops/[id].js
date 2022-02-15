import {
    Box,
    Checkbox,
    Container,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Grid,
    InputLabel,
    Link,
    MenuItem,
    Select,
    Stack,
    Tab,
    Tabs,
    Typography,
  } from "@mui/material";
  import ApolloClient, { gql, InMemoryCache } from "apollo-boost";
  import router, { useRouter } from "next/router";
  import NextLink from "next/link";
  import { useEffect, useMemo, useState } from "react";
  import { useApolloClient } from "react-apollo";
  import { Page, ProductGrid } from "../../components";
  
  const SHOP_QUERY = gql`
    query Shop($id: Int!) {
      shop(id: $id) {
        id
        domain
        storefrontAccessToken
      }
    }
  `;
  
  const SHOP_DETAILS_QUERY = gql`
    query ShopDetails {
      shop {
        name
        description
        primaryDomain {
          url
          host
        }
        paymentSettings {
          currencyCode
        }
      }
      productTypes(first: 250) {
        edges {
          node
        }
      }
    }
  `;
  const SHOP_PRODUCTS_QUERY = gql`
    query ShopProducts(
      $first: Int
      $last: Int
      $before: String
      $after: String
      $query: String
      $sortKey: ProductSortKeys
      $reverse: Boolean
    ) {
      products(
        first: $first
        last: $last
        before: $before
        after: $after
        query: $query
        sortKey: $sortKey
        reverse: $reverse
      ) {
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
        edges {
          cursor
          node {
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
            onlineStoreUrl
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
      }
    }
  `;
  
  const ALL_CATEGORY = "all";
  const DEFAULT_SORT = "best-selling";
  const SORT_MAP = {
    [DEFAULT_SORT]: {
      label: "Best selling",
      sortKey: "BEST_SELLING",
      reverse: false,
    },
    "title-ascending": {
      label: "Alphabetically, A-Z",
      sortKey: "TITLE",
      reverse: false,
    },
    "title-descending": {
      label: "Alphabetically, Z-A",
      sortKey: "TITLE",
      reverse: true,
    },
    "price-ascending": {
      label: "Price, low to high",
      sortKey: "PRICE",
      reverse: false,
    },
    "price-descending": {
      label: "Price, high to low",
      sortKey: "PRICE",
      reverse: true,
    },
    "created-ascending": {
      label: "Date, old to new",
      sortKey: "CREATED_AT",
      reverse: false,
    },
    "created-descending": {
      label: "Date, new to old",
      sortKey: "CREATED_AT",
      reverse: true,
    },
  };
  const PRICE_OPTIONS = [
    "gte.0.lte.49",
    "gte.50.lte.99",
    "gte.100.lte.149",
    "gte.150.lte.199",
    "gte.200.lte.249",
    "gte.250",
  ];
  
  const getUrlParams = (category, sortBy, availability, price) => {
    const urlParams = {};
    if (category) {
      urlParams.category = category;
    }
    if (sortBy !== DEFAULT_SORT) {
      urlParams.sort_by = sortBy;
    }
    const availabilityFilters = getFilterArray(availability);
    if (availabilityFilters.length > 0) {
      urlParams.availability = availabilityFilters;
    }
    const priceFilters = getFilterArray(price);
    if (priceFilters.length > 0) {
      urlParams.price = priceFilters;
    }
    return urlParams;
  };
  
  const getProductQuery = (category, availability, price) => {
    const categoryQuery = category ? `product_type:"${category}"` : "";
    const availabilityQuery = getFilterArray(availability)
      .map((filter) =>
        filter === "0" ? "available_for_sale:false" : "available_for_sale:true"
      )
      .join(" OR ");
    const priceQuery = getFilterArray(price)
      .map((filter) => {
        const filterArr = filter.split(".");
        const lowPrice = filterArr[filterArr.indexOf("gte") + 1];
        const highPrice =
          filterArr.includes("lte") && filterArr[filterArr.indexOf("lte") + 1];
  
        if (highPrice) {
          return `(variants.price:>=${lowPrice} AND variants.price:<=${highPrice})`;
        }
  
        return `(variants.price:>=${lowPrice})`;
      })
      .join(" OR ");
  
    return [categoryQuery, priceQuery, availabilityQuery]
      .reduce((arr, query) => {
        if (query.length > 0) {
          arr.push(`(${query})`);
        }
        return arr;
      }, [])
      .join(" AND ");
  };
  
  const getFilterArray = (filters) => {
    if (!filters) {
      return [];
    }
  
    return Array.isArray(filters) ? filters : [filters];
  };
  
  const ProductSort = ({ sortBy, urlParams }) => {
    const handleSortChange = (evt) => {
      const { value } = evt.target;
      if (value !== DEFAULT_SORT) {
        urlParams.sort_by = value;
      } else {
        delete urlParams.sort_by;
      }
      router.push(
        {
          pathname: location.pathname,
          query: urlParams,
        },
        undefined,
        {
          shallow: true,
        }
      );
    };
  
    return (
      <FormControl>
        <InputLabel id="sort-select-label">Sort by</InputLabel>
        <Select
          labelId="sort-select-label"
          id="sort-select"
          value={sortBy}
          label="Sort by"
          onChange={handleSortChange}
        >
          {Object.keys(SORT_MAP).map((key) => (
            <MenuItem key={key} value={key}>
              {SORT_MAP[key].label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };
  
  const ProductFilters = ({
    availabilityFilters,
    priceFilters,
    currencyCode,
    urlParams,
  }) => {
    const currencySymbol = (0)
      .toLocaleString("en-CA", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      .replace(/\d/g, "")
      .trim();
  
    const priceOptions = useMemo(
      () =>
        PRICE_OPTIONS.map((option) => {
          const optionArr = option.split(".");
          const lowPrice = optionArr[optionArr.indexOf("gte") + 1];
          const formattedLowPrice = parseInt(lowPrice, 10).toLocaleString(
            "en-CA",
            {
              style: "currency",
              currency: currencyCode,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }
          );
          const highPrice =
            optionArr.includes("lte") && optionArr[optionArr.indexOf("lte") + 1];
  
          if (highPrice) {
            const formattedHighPrice = parseInt(highPrice, 10).toLocaleString(
              "en-CA",
              {
                style: "currency",
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }
            );
            return {
              label: `${formattedLowPrice} - ${formattedHighPrice}`,
              value: option,
            };
          }
          return {
            label: `> ${formattedLowPrice}`,
            value: option,
          };
        }),
      []
    );
  
    const handlePriceChange = (evt, checked) => {
      const { value } = evt.target;
      const newPriceFilters = checked
        ? [...priceFilters, value]
        : priceFilters.filter((item) => item !== value);
      if (newPriceFilters.length > 0) {
        urlParams.price = newPriceFilters;
      } else {
        delete urlParams.price;
      }
  
      router.push(
        {
          pathname: location.pathname,
          query: urlParams,
        },
        undefined,
        {
          shallow: true,
        }
      );
    };
  
    const handleAvailabilityChange = (evt, checked) => {
      const { value } = evt.target;
      const newAvailabilityFilters = checked
        ? [...availabilityFilters, value]
        : availabilityFilters.filter((item) => item !== value);
      if (newAvailabilityFilters.length > 0) {
        urlParams.availability = newAvailabilityFilters;
      } else {
        delete urlParams.availability;
      }
  
      router.push(
        {
          pathname: location.pathname,
          query: urlParams,
        },
        undefined,
        {
          shallow: true,
        }
      );
    };
  
    return (
      <Stack spacing={2} direction={{ xs: "row", md: "column" }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">
            <Typography variant="caption">{`Price (${currencySymbol})`}</Typography>
          </FormLabel>
          <FormGroup>
            {priceOptions.map(({ value, label }) => (
              <FormControlLabel
                key={value}
                control={
                  <Checkbox
                    checked={priceFilters.includes(value)}
                    value={value}
                    onChange={handlePriceChange}
                  />
                }
                label={label}
              />
            ))}
          </FormGroup>
        </FormControl>
        <FormControl component="fieldset">
          <FormLabel component="legend">
            <Typography variant="caption">Availability</Typography>
          </FormLabel>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={availabilityFilters.includes("1")}
                  onChange={handleAvailabilityChange}
                  value="1"
                />
              }
              label="In stock"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={availabilityFilters.includes("0")}
                  onChange={handleAvailabilityChange}
                  value="0"
                />
              }
              label="Out of stock"
            />
          </FormGroup>
        </FormControl>
      </Stack>
    );
  };
  
  const CategoryTabs = ({ productTypes }) => {
    const router = useRouter();
    const { category } = router.query;
  
    const categories = productTypes.edges.reduce((arr, { node }) => {
      if (node.length) {
        arr.push(node);
      }
      return arr;
    }, []);
  
    useEffect(() => {
      if (category && categories && !categories.includes(category)) {
        router.push(location.pathname, undefined, { shallow: true });
      }
    }, [categories, category]);
  
    if (categories.length === 0) {
      return null;
    }
  
    const handleCategorySelect = (_, value) => {
      if (value !== ALL_CATEGORY) {
        router.push(
          {
            pathname: location.pathname,
            query: {
              category: value,
            },
          },
          undefined,
          { shallow: true }
        );
      } else {
        router.push(location.pathname, undefined, { shallow: true });
      }
    };
  
    return (
      <>
        <Container maxWidth="lg">
          <Tabs
            value={category || ALL_CATEGORY}
            onChange={handleCategorySelect}
            aria-label="Categories"
          >
            <Tab label="All categories" value={ALL_CATEGORY} />
            {categories.map((value) => (
              <Tab key={value} label={value} value={value} />
            ))}
          </Tabs>
        </Container>
        <Divider />
      </>
    );
  };
  
  const PaginatedProducts = ({ id, productData, urlParams }) => {
    if (!productData) {
      return (
        <Typography variant="h3" component="div" textAlign="center">
          Loading
        </Typography>
      );
    }
  
    const {
      edges,
      pageInfo: { hasNextPage, hasPreviousPage },
    } = productData;
    const products = edges.map(({ node }) => node);
  
    const nextUrlParams = hasNextPage && {
      ...urlParams,
      after: edges[edges.length - 1].cursor,
    };
    const prevUrlParams = hasPreviousPage && {
      ...urlParams,
      before: edges[0].cursor,
    };
  
    return (
      <>
        <ProductGrid shopId={id} products={products} columns={3} />
        {(prevUrlParams || nextUrlParams) && (
          <Stack flexDirection="row" justifyContent="space-between">
            {prevUrlParams ? (
              <NextLink
                href={{
                  pathname: location.pathname,
                  query: prevUrlParams,
                }}
              >
                <Link
                  variant="button"
                  href={{
                    pathname: location.pathname,
                    query: prevUrlParams,
                  }}
                >
                  Prev
                </Link>
              </NextLink>
            ) : (
              <div />
            )}
            {nextUrlParams ? (
              <NextLink
                href={{
                  pathname: location.pathname,
                  query: nextUrlParams,
                }}
              >
                <Link
                  variant="button"
                  href={{
                    pathname: location.pathname,
                    query: nextUrlParams,
                  }}
                >
                  Next
                </Link>
              </NextLink>
            ) : (
              <div />
            )}
          </Stack>
        )}
      </>
    );
  };
  
  const ProductSection = ({ currencyCode, storefrontClient }) => {
    const router = useRouter();
    const {
      id,
      before,
      after,
      category,
      sort_by: sortBy = DEFAULT_SORT,
      availability,
      price,
    } = router.query;
    const [productData, setProductData] = useState(null);
    const urlParams = getUrlParams(category, sortBy, availability, price);
  
    useEffect(() => {
      async function fetchData(client) {
        const variables = before
          ? {
              last: 12,
              before,
            }
          : {
              first: 12,
              after,
            };
  
        const { data } = await client.query({
          query: SHOP_PRODUCTS_QUERY,
          variables: {
            ...variables,
            query: getProductQuery(category, availability, price),
            sortKey: SORT_MAP[sortBy].sortKey,
            reverse: SORT_MAP[sortBy].reverse,
          },
        });
        setProductData(data.products);
      }
  
      if (storefrontClient) {
        fetchData(storefrontClient);
      }
    }, [storefrontClient, before, after, category, sortBy, availability, price]);
  
    useEffect(() => {
      if (productData && !productData.pageInfo.hasPreviousPage && before) {
        router.replace({
          pathname: location.pathname,
          query: urlParams,
        });
      }
    }, [productData, before, urlParams, router]);
  
    useEffect(() => {
      setProductData(null);
    }, [before, after, category, sortBy, availability, price]);
  
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={3} mt={2}>
          <ProductFilters
            availabilityFilters={getFilterArray(availability)}
            priceFilters={getFilterArray(price)}
            currencyCode={currencyCode}
            urlParams={urlParams}
          />
        </Grid>
        <Grid item xs={12} md={9}>
          <Stack alignItems="end" pt={2} pb={2}>
            <ProductSort sortBy={sortBy} urlParams={urlParams} />
          </Stack>
          <PaginatedProducts
            id={id}
            productData={productData}
            urlParams={urlParams}
          />
        </Grid>
      </Grid>
    );
  };
  
  const Shop = () => {
    const router = useRouter();
    const { id } = router.query;
    const [shopData, setShopData] = useState(null);
    const [data, setData] = useState(null);
    const [storefrontClient, setStorefrontClient] = useState(null);
    const client = useApolloClient();
  
    useEffect(() => {
      async function fetchData(id) {
        const { data } = await client.query({
          query: SHOP_QUERY,
          variables: {
            id: parseInt(id, 10),
          },
        });
        setData(data);
      }
      if (!data) {
        fetchData(id);
      }
    }, [id]);
  
    useEffect(() => {
      if (data && data.shop) {
        const { domain, storefrontAccessToken } = data.shop;
        const client = new ApolloClient({
          uri: `https://${domain}/api/2021-10/graphql.json`,
          headers: {
            "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
          },
          cache: new InMemoryCache(),
        });
        setStorefrontClient(client);
      }
    }, [data]);
  
    useEffect(() => {
      async function fetchData(client) {
        const { data } = await client.query({
          query: SHOP_DETAILS_QUERY,
        });
        setShopData(data);
      }
  
      if (storefrontClient) {
        fetchData(storefrontClient);
      }
    }, [storefrontClient]);
  
    if (!shopData) {
      return (
        <Page>
          <Container maxWidth="xl">
            <Typography variant="h3" component="div" textAlign="center" pt={2}>
              Shop not found
            </Typography>
          </Container>
        </Page>
      );
    }
  
    return (
      <Page>
        <Container maxWidth="lg">
          <Stack spacing={3} pt={10} pb={10}>
            <Typography variant="h1">{shopData.shop.name}</Typography>
            <Typography component="span">
              Website:{" "}
              <Link href={shopData.shop.primaryDomain.url} target="_blank">
                {shopData.shop.primaryDomain.host}
              </Link>
            </Typography>
            <Container maxWidth="sm" disableGutters>
              <Typography component="p">{shopData.shop.description}</Typography>
            </Container>
          </Stack>
        </Container>
        <Divider />
        <CategoryTabs productTypes={shopData.productTypes} />
        <Container
          maxWidth="xl"
          sx={{
            pt: 2,
            pb: 2,
          }}
        >
          <ProductSection
            currencyCode={shopData.shop.paymentSettings.currencyCode}
            storefrontClient={storefrontClient}
          />
        </Container>
      </Page>
    );
  };
  
  export default Shop;