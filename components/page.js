import Head from "next/head";
import {
  AppBar,
  Badge,
  Box,
  Container,
  Divider,
  Link,
  Toolbar,
  Stack,
  Typography,
} from "@mui/material";
import { ShoppingCart } from "@mui/icons-material";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { getCartCount } from "../helpers/cartHelpers";

const Page = ({ children, subHeader }) => {
  const [cartCount, setCartCount] = useState(null);

  useEffect(() => {
    function updateCartCount() {
      setCartCount(getCartCount());
    }

    window.addEventListener("storage", updateCartCount);

    setCartCount(getCartCount());

    return () => {
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <header>
        <AppBar color="background" height="70px">
          <Toolbar disableGutters>
            <Container maxWidth="xl">
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <NextLink href="/">
                  <Link href=""><img src="/logo.svg" alt="Mockingbird" /></Link>
                </NextLink>
                <NextLink href="/cart">
                  <Link href="/cart">
                    <Box>
                      <Badge badgeContent={cartCount} color="warning">
                        <ShoppingCart color="primary" fontSize="large" />
                      </Badge>
                    </Box>
                  </Link>
                </NextLink>
              </Stack>
            </Container>
          </Toolbar>
          {subHeader && (
            <>
              <Divider />
              {subHeader}
            </>
          )}
        </AppBar>
      </header>
      <main>
        <Container
          disableGutters
          maxWidth={false}
          sx={{
            mt: "70px",
          }}
        >
          {children}
        </Container>
      </main>
      <Divider />
      <footer>
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
          flexWrap="wrap"
          sx={{
            pt: 4,
            pb: 4,
          }}
        >
          <Link href="https://www.shopify.com/" target="_blank" rel="noopener"><img alt="Shopify" src="/shopify-logo.svg" /></Link>
          <Typography textAlign="center" variant="body1">MockingBird is a Shopify demo that uses <span style={{fontWeight: 600}}>Marketplace Kit</span> to build <span style={{fontWeight: 600}}>Marketplaces</span></Typography>
        </Stack>
      </footer>
    </>
  );
};

export default Page;