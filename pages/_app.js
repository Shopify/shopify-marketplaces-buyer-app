import '../styles/globals.css'
import ApolloClient, { InMemoryCache } from "apollo-boost";
import { ApolloProvider } from "react-apollo";
import { createTheme, ThemeProvider } from "@mui/material";

function MarketplaceProvider(props) {
  const client = new ApolloClient({
    uri: `http://localhost:8081/graphql`,
    cache: new InMemoryCache(),
  });

  const Component = props.Component;

  return (
    <ApolloProvider client={client}>
      <ThemeProvider
        theme={createTheme({
          typography: {
            fontFamily: "Source Sans Pro",
            htmlFontSize: 16,
            allVariants: {
              color: "#212326",
            },
            h1: {
              letterSpacing: "0.05em",
              fontWeight: "700",
              fontSize: "2.25rem",
              textTransform: "uppercase",
            },
            h2: {
              letterSpacing: "0.05em",
              fontWeight: "700",
              fontSize: "1.5rem",
              textTransform: "uppercase",
            },
            h3: {
              fontSize: "1.125rem",
              fontWeight: "600",
              letterSpacing: "0.02em",
            },
            body1: {
              fontSize: "1rem",
              letterSpacing: "0.02em",
            },
            body2: {
              fontSize: "1.5rem",
              fontWeight: "700",
              letterSpacing: "0.02em",
              color: "#006D51",
            },
            caption: {
              fontSize: "1rem",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            },
            button: {
              fontWeight: "700",
              letterSpacing: "0.05em",
            },
            subtitle1: {
              fontWeight: "700",
              fontSize: "2rem",
              letterSpacing: "0.02em",
              color: "#006D51",
            },
            subtitle2: {
              fontSize: "1.125rem",
              fontWeight: "700",
              letterSpacing: "0.02em",
            },
          },
          palette: {
            primary: {
              main: "#006D51",
            },
            secondary: {
              main: "#006D51",
            },
            text: {
              primary: "#212326",
            },
          },
        })}
      >
        <Component {...props} />
      </ThemeProvider>
    </ApolloProvider>
  );
}

function MyApp({ Component, pageProps }) {
  return <MarketplaceProvider Component={Component} {...pageProps} />;
}

export default MyApp
