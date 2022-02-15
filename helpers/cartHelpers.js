import { gql } from "apollo-boost";

const CART_CREATE_MUTATION = gql`
  mutation cartCreate($input: CartInput) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

const CART_LINES_ADD_MUTATION = gql`
  mutation cartLinesAdd($lines: [CartLineInput!]!, $cartId: ID!) {
    cartLinesAdd(lines: $lines, cartId: $cartId) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

export const CORE_CART_FIELDS = gql`
  fragment CoreCartFields on Cart {
    id
    checkoutUrl
    estimatedCost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines (first: 20) {
      edges {
        node {
          id
          merchandise {
            ... on ProductVariant {
              id
              image {
                originalSrc
              }
              priceV2 {
                amount
                currencyCode
              }
              product {
                title
              }
              selectedOptions {
                name
                value
              }
            }
          }
          quantity
        }
      }
    }
  }
`;

const CART_LINE_ITEMS_REMOVE_MUTATION = gql`
  ${CORE_CART_FIELDS}
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CoreCartFields
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = gql`
  ${CORE_CART_FIELDS}
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CoreCartFields
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

const CART_COUNT = 'cartCount';
const CARTS = 'carts';

export const getCartCount = () => {
  return JSON.parse(window.localStorage.getItem(CART_COUNT));
}

const increaseCartCount = () => {
  let currentCount = JSON.parse(getCartCount());
  if (!currentCount) currentCount = 0;
  window.localStorage.setItem(CART_COUNT, JSON.stringify(currentCount + 1));
  window.dispatchEvent(new Event('storage'));
}

export const setCartCount = amount => {
  window.localStorage.setItem(CART_COUNT, JSON.stringify(amount));
  window.dispatchEvent(new Event('storage'));
}

export const getCarts = () => {
  const carts =  JSON.parse(window.localStorage.getItem(CARTS));

  if (!carts) {
    window.localStorage.setItem(CARTS, JSON.stringify({}));
    return {};
  }

  return carts;
}

const setCartIdForShop = (cartId, shopDomain) => {
  const currentCarts = getCarts();
  window.localStorage.setItem(CARTS, JSON.stringify({
    ...currentCarts,
    [shopDomain]: cartId,
  }));
}

const createNewCart = async(variantId, shopDomain, shopClient) => {
  const mutationData = {
    input: {
      lines: [
        {
          merchandiseId: `${variantId}`,
          quantity: 1,
        },
      ],
    }
  };

  const { data } = await shopClient.mutate({
    mutation: CART_CREATE_MUTATION,
    variables: mutationData,
  });

  setCartIdForShop(data.cartCreate.cart.id, shopDomain);
  return data;
}

const addToExistingCart = async(cartId, variantId, shopDomain, shopClient) => {
  const mutationData = {
    lines: [
      {
        merchandiseId: `${variantId}`,
      },
    ],
    cartId: cartId,
  };

  const { data } = await shopClient.mutate({
    mutation: CART_LINES_ADD_MUTATION,
    variables: mutationData,
  });

  if (!data.cartLinesAdd.cart) {
    createNewCart(variantId, shopDomain, shopClient);
  }

  increaseCartCount();
}

export const addToCart = async(variantId, shopDomain, shopClient) => {
  const carts = getCarts();

  if (!carts[shopDomain]) {
    createNewCart(variantId, shopDomain, shopClient);
    increaseCartCount();
    return;
  }
  
  addToExistingCart(carts[shopDomain], variantId, shopDomain, shopClient);
}

export const addToCartAndCheckout = async(variantId, shopDomain, shopClient) => {
  const cartData = await createNewCart(variantId, shopDomain, shopClient);
  window.open(
    cartData.cartCreate.cart.checkoutUrl,
    '_blank',
  );
}

export const removeItemFromCart = async(cartId, lineItemId, shopClient) => {
  const mutationData = {
    cartId,
    lineIds: [lineItemId],
  };

  const { data } = await shopClient.mutate({
    mutation: CART_LINE_ITEMS_REMOVE_MUTATION,
    variables: mutationData,
  });

  return data;
}

export const updateItemCountInCart = async(cartId, lineItemId, quantity, shopClient) => {
  const mutationData = {
    cartId,
    lines: [
      {
        id: lineItemId,
        quantity,
      }
    ]
  };

  const {data} = await shopClient.mutate({
    mutation: CART_LINES_UPDATE_MUTATION,
    variables: mutationData,
  });

  return data;
}