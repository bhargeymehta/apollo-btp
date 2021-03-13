const { server } = require("./build/server");

// import and host the server
server.listen().then(({ url }) => {
  console.log(`Apollo GQL server ready at ${url}`);
});
