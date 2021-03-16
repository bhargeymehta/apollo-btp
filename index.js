const { server } = require("./.build/server");
const {
  config: { port },
} = require("./.build/server-config");

// import and host the server
server.listen({ port }).then(({ url }) => {
  console.log(`Apollo GQL server ready at ${url}`);
});
