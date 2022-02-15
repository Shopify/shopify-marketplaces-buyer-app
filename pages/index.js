import { useEffect, useState } from "react";
import Head from "next/head";
import NextLink from "next/link";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import ApolloClient, { InMemoryCache } from "apollo-boost";
import {
  Container,
  Divider,
  FormControl,
  InputBase,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Typography,
  alpha,
  styled,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { getCartCount } from "../helpers/cartHelpers";
import { Page, ProductGrid } from "../components";

const allCountries = "All";

export const SHOPS_QUERY = gql`
  query Shops($country: String, $name: String, $reverse: Boolean) {
    shops(country: $country, nameIsLike: $name, reverse: $reverse) {
      id
      domain
      storefrontAccessToken
    }
  }
`;

export const SHOP_COUNTRIES = gql`
  query ShopCountries {
    shopCountries
  }
`;

const SHOP_PRODUCT_QUERY = gql`
  query ShopProducts {
    shop {
      name
    }
    products(first: 4) {
      edges {
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
          onlineStoreUrl
        }
      }
    }
  }
`;

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  display: "block",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    height: "100%",
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

const ShopSection = ({ id, domain, storefrontAccessToken }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const client = new ApolloClient({
        uri: `https://${domain}/api/2021-10/graphql.json`,
        headers: {
          "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
        },
        cache: new InMemoryCache(),
      });
      const { data } = await client.query({
        query: SHOP_PRODUCT_QUERY,
      });
      setData(data);
    }
    fetchData();
  }, [domain, storefrontAccessToken]);

  if (!data) {
    return null;
  }

  const { edges } = data.products;
  const products = edges.map(({ node }) => node);

  return (
    <>
      <Stack
        mt={6}
        mb={4}
        justifyContent="space-between"
        direction="row"
        alignItems="center"
        position="relative"
      >
        <Typography variant="h2">{data.shop.name}</Typography>
        <NextLink href={`/shops/${id}`}>
          <Link variant="button" href="">
            View all products
          </Link>
        </NextLink>
      </Stack>
      <ProductGrid products={products} shopId={id} />
    </>
  );
};

const SubHeader = ({
  activeCountry,
  countries,
  descendingSort,
  onSearchKeyDown,
  setCountry,
  setSort,
}) => (
  <Container
    maxWidth="xl"
    sx={{
      pt: 2,
      pb: 2,
    }}
  >
    <Stack flexDirection="row" justifyContent="space-between">
      <FormControl style={{ minWidth: "120px" }}>
        <InputLabel id="selectCountryLabel">Show Stores From</InputLabel>
        <Select
          labelId="selectCountryLabel"
          id="selectCountry"
          label="Show Stores From"
          value={activeCountry}
          onChange={setCountry}
        >
          {countries.map((country) => (
            <MenuItem key={country} value={country}>
              {country}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Stack direction="row" alignItems="center" justifyContent="flex-end">
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search…"
            inputProps={{ "aria-label": "search" }}
            onKeyDown={onSearchKeyDown}
          />
        </Search>
        <FormControl>
          <InputLabel id="setSortLabel">Sort Names</InputLabel>
          <Select
            labelId="setSortLabel"
            id="sortSelect"
            value={descendingSort}
            label="Sort Names"
            onChange={setSort}
          >
            <MenuItem value={false}>Ascending</MenuItem>
            <MenuItem value={true}>Descending</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Stack>
  </Container>
);

const ShopsSection = ({ shops }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const shopsPerPage = 5;
  const currentShopIndex = pageIndex * shopsPerPage;
  const nextPageLimit = currentShopIndex + shopsPerPage;
  const numberOfPages = shops ? Math.ceil(shops.length / shopsPerPage) : 0;
  const hasNextPage = pageIndex < (numberOfPages - 1);
  const hasPreviousPage = pageIndex > 0;

  useEffect(() => {
    if (pageIndex > 0) {
      window.scrollTo(0, 0);
    }
  }, [pageIndex]);

  useEffect(() => {
    setPageIndex(0);
  }, [shops]);

  if (!shops) {
    return (
      <Stack mt={15} alignItems="center">
        <Typography variant="h3" component="span">
          No shops
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack mt={8} mb={7} divider={<Divider />}>
      {shops.slice(currentShopIndex, nextPageLimit).map((props) => (
        <ShopSection key={props.id} {...props} />
      ))}
      {numberOfPages > 1 && <Stack
        justifyContent="space-between"
        direction="row"
        alignItems="center"
        mt={4} mb={4}
      >
        {hasPreviousPage ? <Link variant="button" component="button" onClick={() => setPageIndex(current => current - 1)}>Previous Page</Link> : <span />}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <FormControl>
            <InputLabel id="shop-page-select-label">Page </InputLabel>
            <Select
              labelId="shop-page-select-label"
              id="shop-page-select"
              label="Page"
              value={pageIndex}
              onChange={e => setPageIndex(e.target.value)}
            >
              {[...Array(numberOfPages).keys()].map(pageNumber => <MenuItem key={pageNumber} value={pageNumber}>{pageNumber + 1}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body1" sx={{p: 1}}>{`of ${numberOfPages}`}</Typography>
        </Stack>
        {hasNextPage ? <Link variant="button" component="button" onClick={() => setPageIndex(current => current + 1)}>Next Page</Link> : <span />}
      </Stack>}
    </Stack>
  );
};

const Index = () => {
  const [countryFilter, setCountryFilter] = useState(allCountries);
  const [descendingSort, setDescendingSort] = useState(false);
  const [searchString, setSearchString] = useState("");

  const { data } = useQuery(SHOPS_QUERY, {
    variables: {
      country:
        !countryFilter || countryFilter == allCountries ? "" : countryFilter,
      name: searchString || "",
      reverse: descendingSort,
    },
  });

  const { data: shopCountries } = useQuery(SHOP_COUNTRIES);

  const countries = shopCountries ? shopCountries.shopCountries : [];
  if (!countries.includes(allCountries)) countries.unshift(allCountries);

  const onSearchKeyDown = (e) => {
    if (e.keyCode == 13) {
      setSearchString(e.target.value);
    }
  };

  const setCountry = (e) => {
    setCountryFilter(e.target.value);
  };

  const setSort = (e) => {
    setDescendingSort(e.target.value);
  };

  return (
    <Page
      subHeader={
        <SubHeader
          activeCountry={countryFilter}
          countries={countries}
          descendingSort={descendingSort}
          onSearchKeyDown={onSearchKeyDown}
          setCountry={setCountry}
          setSort={setSort}
        />
      }
    >
      <Container maxWidth="xl" sx={{ mt: "150px" }}>
        <ShopsSection shops={data?.shops} />
      </Container>
    </Page>
  );
};

export default Index;