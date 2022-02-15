import {
    Box,
    Button,
    Container,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
  } from "@mui/material";
  import { Close } from "@mui/icons-material";
  import ApolloClient, { gql, InMemoryCache } from "apollo-boost";
  import { useEffect, useState } from "react";
  import { Page } from "../../components";
  import {
    CORE_CART_FIELDS,
    getCartCount,
    getCarts,
    removeItemFromCart,
    setCartCount,
    updateItemCountInCart,
  } from "../../helpers/cartHelpers";
  
  export const SHOPS_QUERY = gql`
    query Shops($domains: [String]) {
      shops(domains: $domains) {
        id
        domain
        name
        storefrontAccessToken
      }
    }
  `;
  
  const CART_DETAILS_QUERY = gql`
    ${CORE_CART_FIELDS}
    query getCart($id: ID!) {
      cart(id: $id) {
        ...CoreCartFields
      }
    }
  `;
  
  const getShopTotals = lineItems => {
    const totalNumberOfItems = lineItems.reduce((total, {node}) => total + node.quantity, 0);
    const itemsInfo = lineItems.map(({node}) => `${node.quantity} x ${node.merchandise.product.title}`);
    return {
      totalNumberOfItems,
      itemsInfo,
    };
  };
  
  const ShopCartItems = ({cartId, lineItems, onDeleteItem, onSetNewQuantity, shopDomain}) => {
    return lineItems.map(({node}) => {
      const optionsHTML = node.merchandise.selectedOptions.map(option => (
        <Stack mb={1} mt={1} key={option.name}>
          <Typography variant="body1">{option.name}: {option.value}</Typography>
        </Stack>
      ));
  
      const {amount, currencyCode} = node.merchandise.priceV2;
      const formattedPrice = new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: currencyCode,
      }).format(amount);
  
      return (
        <Stack direction="row" key={node.merchandise.id}>
          <Box width="25%">
            <img
              src={node.merchandise.image.originalSrc}
              style={{
                objectFit: "contain",
                maxHeight: "250px",
                width: '100%'
              }}
            />
          </Box>
          <Stack ml={3} width="65%" justifyContent="space-around">
            <Typography variant="subtitle2">{node.merchandise.product.title}</Typography>
            {optionsHTML}
            <Typography variant="body2">{formattedPrice}</Typography>
          </Stack>
          <Stack spacing={4} width="10%" textAlign="right">
            <Box>
              <Close
                color="primary"
                fontSize="small"
                onClick={() => {onDeleteItem(cartId, node.id, shopDomain)}}
                sx={{ cursor: "pointer"}}
              />
            </Box>
            <FormControl>
              <InputLabel id="quantityLabel">Quantity</InputLabel>
              <Select
                labelId="selectQuantityLabel"
                id="selectQuantity"
                label="Quantity"
                value={node.quantity}
                onChange={(e) => onSetNewQuantity(cartId, node.id, e.target.value, shopDomain)}
              >
                {[...Array(node.quantity + 10).keys()].slice(1).map((quantity) => (
                  <MenuItem key={quantity} value={quantity}>
                    {quantity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      );
    });
  };
  
  const Cart = () => {
    const [shopInfo, setShopInfo] = useState(null);
    const [shopClients, setShopClients] = useState(null);
    const [localCartCount, setLocalCartCount] = useState(null);
    const [cartsInfo, setCartsInfo] = useState(null);
  
    useEffect(() => {
      async function getCartsInfo() {
        const carts = getCarts();
  
        const client = new ApolloClient({
          uri: `http://localhost:8081/graphql`,
          cache: new InMemoryCache(),
        });
  
        const { data: shopsData } = await client.query({
          query: SHOPS_QUERY,
          variables: {
            domains: Object.keys(carts)
          }
        });
  
        const shopsDict = {};
        const shopsClients = {};
        const cartsDict = {};
      
        for(let i = 0; i < shopsData.shops.length; i++) {
          const shop = shopsData.shops[i];
          const domain = shop.domain;
          shopsDict[domain] = {
            name: shop.name,
            token: shop.storefrontAccessToken,
          };
  
          const shopClient = new ApolloClient({
            uri: `https://${domain}/api/2021-10/graphql.json`,
            headers: {
              "X-Shopify-Storefront-Access-Token": shop.storefrontAccessToken,
            },
            cache: new InMemoryCache(),
          });
          shopsClients[domain] = shopClient;
  
          const variables = {
            id: carts[domain],
          };
          const { data: cartData } = await shopClient.query({
            query: CART_DETAILS_QUERY,
            variables,
          });
  
          cartsDict[domain] = cartData.cart;
        }
        setShopInfo(shopsDict);
        setShopClients(shopsClients);
        setCartsInfo(cartsDict);
      }
  
      const processMessage = msg => {
        let data;
        try {
          data = JSON.parse(msg.data);
        } catch (err) {
          data = {};
        }
        if (data.syncCart || (data.current_checkout_page && data.current_checkout_page === '/checkout/thank_you')) {
          window.location.reload();
        }
      };
  
      getCartsInfo();
  
      window.addEventListener('message', processMessage);
  
      return () => {
        window.removeEventListener('message', processMessage);
      };
    }, []);
  
    useEffect(() => {
      if (localCartCount !== getCartCount()) {
        setCartCount(localCartCount);
      }
    }, [localCartCount])
  
    const deleteItem = async(cartId, lineItemId, shopDomain) => {
      const newCart = await removeItemFromCart(cartId, lineItemId, shopClients[shopDomain]);
      setCartsInfo({
        ...cartsInfo,
        [shopDomain]: newCart.cartLinesRemove.cart,
      });
    };
  
    const setNewQuantity = async(cartId, lineItemId, quantity, shopDomain) => {
      const newCart = await updateItemCountInCart(cartId, lineItemId, quantity, shopClients[shopDomain]);
      setCartsInfo({
        ...cartsInfo,
        [shopDomain]: newCart.cartLinesUpdate.cart,
      });
    }
  
    const cartShops = [];
    const cartsSummary = [];
    let cartsSummaryContainer = [];
    let cartTotalAmount = 0;
    let cartTotalNumberOfItems = 0;
  
    if (!cartsInfo) {
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
  
    for (const [shopDomain, cartData] of Object.entries(cartsInfo)) {
      if (cartData) {
        cartTotalAmount += parseInt(cartData.estimatedCost.totalAmount.amount);
  
        const {amount, currencyCode} = cartData.estimatedCost.totalAmount;
        const formattedPrice = new Intl.NumberFormat("en-CA", {
          style: "currency",
          currency: currencyCode,
        }).format(amount);
  
        cartShops.push(
          <Stack border="1px solid #D7D7DB" padding={2} mb={3} key={shopDomain} spacing={2}>
            <Typography variant="h2">{shopInfo[shopDomain].name}</Typography>
            <Divider />
            <ShopCartItems
              cartId={cartData.id}
              lineItems={cartData.lines.edges}
              onDeleteItem={deleteItem}
              onSetNewQuantity={setNewQuantity}
              shopDomain={shopDomain}
            />
            <Divider />
            <Stack
              alignItems="center"
              direction="row"
            >
              <Box width='25%' textAlign="right">
                <Typography variant="subtitle2">SUBTOTAL</Typography>
              </Box>
              <Box width='50%' ml={3}>
                <Typography variant="body2">{formattedPrice}</Typography>
              </Box>
              <Box width='25%'>
                <Button
                  onClick={() => window.open(cartData.checkoutUrl, '_blank')}
                  sx={{ height: "56px", width: "100%" }}
                  variant="contained"
                >
                  GO TO CHECKOUT
                </Button>
              </Box>
            </Stack>
          </Stack>
        );
        
        const shopTotals = getShopTotals(cartData.lines.edges);
        cartTotalNumberOfItems += shopTotals.totalNumberOfItems;
        cartsSummary.push(
          <Stack direction="row" justifyContent="space-between" mt={2} key={shopDomain} spacing={2}>
            <Box>
              <Typography variant="h3">{shopTotals.totalNumberOfItems} items from {shopInfo[shopDomain].name}</Typography>
              <ul>
                {
                  shopTotals.itemsInfo.map((itemInfo, index) => <li key={index}><Typography variant="body1">{itemInfo}</Typography></li>)
                }
              </ul>
            </Box>
            <Box>
              <Typography variant="body2">{formattedPrice}</Typography>
            </Box>
          </Stack>
        );
      } else {
        cartShops.push(
          <Stack border="1px solid #D7D7DB" padding={2} mb={3} key={shopDomain} spacing={2}>
            <Typography variant="h2">{shopInfo[shopDomain].name}</Typography>
            <Divider />
            <Typography variant="body1">Checkout has already been completed for this shop!</Typography>
          </Stack>
        );
      }
    }
  
    const formattedTotalPrice = new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(cartTotalAmount);
  
    cartsSummaryContainer = (
      <Stack border="1px solid #D7D7DB" padding={2} spacing={2}>
        <Typography variant="h2">CART SUMMARY</Typography>
        <Divider />
        {cartsSummary}
        <Divider />
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Typography variant="subtitle2">CART TOTAL</Typography>
          <Typography variant="body2">{formattedTotalPrice}</Typography>
        </Stack>
      </Stack>
    );
  
    if (cartTotalNumberOfItems !== localCartCount) {
      setLocalCartCount(cartTotalNumberOfItems);
    }
  
    return (
      <Page>
        <Container maxWidth="xl" sx={{ mt: 15 }}>
          <Container maxWidth="xl" sx={{ mb: 2 }}>
            <Typography variant="h1">YOUR CART ({cartTotalNumberOfItems} ITEMS)</Typography>
          </Container>
          <Grid mt={2} container spacing={3} direction={{ md: "row-reverse" }}>
            <Grid item xs={12} sm={12} md={6} lg={4}>
              {cartsSummaryContainer}
            </Grid>
            <Grid item xs={12} sm={12} md={6} lg={8}>
              {cartShops}
            </Grid>
          </Grid>
        </Container>
      </Page>
    );
  };
  
  export default Cart;