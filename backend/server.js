import express from 'express'

const app = express();

// app.get('/',(req,res) => {
//     res.send('server is ready');
// });

app.get('/api/jokes',(req,res) => {
    const jokes = [
        {
    id: 1,
    title: "Introduction to Express.js",
    content: "Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications."
  },
  {
    id: 2,
    title: "Understanding Middleware",
    content: "Middleware functions are functions that have access to the request object, the response object, and the next middleware function in the application’s request-response cycle."
  },
  {
    id: 3,
    title: "Routing Basics",
    content: "Routing refers to determining how an application responds to a client request to a particular endpoint, which is a URI and a specific HTTP request method."
  },
  {
    id: 4,
    title: "Working with Controllers",
    content: "Controllers handle incoming HTTP requests and encapsulate the business logic, sending appropriate HTTP responses back to the client."
  },
  {
    id: 5,
    title: "Database Integration with MongoDB",
    content: "MongoDB is a NoSQL document database that seamlessly pairs with Node.js and Express using object data modeling libraries like Mongoose."
  },
  {
    id: 6,
    title: "RESTful API Architecture",
    content: "RESTful APIs rely on standard HTTP methods like GET, POST, PUT, and DELETE to manipulate resources represented as objects."
  },
  {
    id: 7,
    title: "Environment Variables in Node",
    content: "Environment variables allow developers to manage configuration settings such as port numbers, API keys, and database URIs securely using dotenv."
  },
  {
    id: 8,
    title: "JWT Authentication",
    content: "JSON Web Tokens provide a compact and self-contained way for securely transmitting information between parties for stateless authentication."
  },
  {
    id: 9,
    title: "Password Hashing with Bcrypt",
    content: "Bcrypt is a key-derivation function designed to securely hash user passwords before storing them in a database, protecting against rainbow table attacks."
  },
  {
    id: 10,
    title: "Handling File Uploads",
    content: "Node.js applications often use libraries like Multer as middleware to handle multipart/form-data requests for uploading images and files."
  },
  {
    id: 11,
    title: "Error Handling Middleware",
    content: "Express allows you to define custom error-handling middleware functions with four arguments (err, req, res, next) to gracefully handle backend exceptions."
  },
  {
    id: 12,
    title: "CORS Explanation",
    content: "Cross-Origin Resource Sharing is an HTTP-header based mechanism that allows a server to indicate any origins other than its own from which a browser should permit loading resources."
  },
  {
    id: 13,
    title: "Asynchronous JavaScript",
    content: "Promises and async/await syntax in JavaScript simplify non-blocking I/O operations when reading files or fetching data from databases."
  },
  {
    id: 14,
    title: "SQL vs NoSQL Databases",
    content: "SQL databases are relational and table-based, whereas NoSQL databases are non-relational and store data as documents, key-value pairs, or graphs."
  },
  {
    id: 15,
    title: "Data Validation with Joi",
    content: "Input validation ensures incoming request bodies match expected schemas before executing business logic, preventing malformed data errors."
  },
  {
    id: 16,
    title: "Rate Limiting for Security",
    content: "Rate limiting restricts repeated requests to public APIs to protect web applications from brute-force attacks and denial-of-service attempts."
  },
  {
    id: 17,
    title: "WebSockets and Real-time Communication",
    content: "WebSockets provide a full-duplex communication channel over a single TCP connection, ideal for real-time applications like chat rooms or live notifications."
  },
  {
    id: 18,
    title: "Understanding Node.js Event Loop",
    content: "The Event Loop allows Node.js to perform non-blocking I/O operations by offloading tasks to the operating system kernel whenever possible."
  },
  {
    id: 19,
    title: "Deploying Backend Applications",
    content: "Hosting services like Render, Railway, and AWS provide cloud environments to run server scripts, manage environment secrets, and handle scale."
  },
  {
    id: 20,
    title: "Building Custom CLI Tools",
    content: "Node.js scripts can be executed directly from the terminal to automate development workflows, manipulate files, or scaffold starter projects."
  },
  {
    id: 21,
    title: "Session-Based Authentication",
    content: "Session-based authentication relies on server-side stored session IDs and client-side cookies to keep users authenticated across HTTP requests."
  },
  {
    id: 22,
    title: "Structuring Node.js Projects",
    content: "Organizing code into separate directories for routes, controllers, models, and services makes large codebases scalable and easier to maintain."
  },
  {
    id: 23,
    title: "Logging with Winston",
    content: "Structured logging frameworks capture application runtime logs, warnings, and errors across different transports like console, files, or cloud monitoring tools."
  },
  {
    id: 24,
    title: "Unit Testing with Jest",
    content: "Jest is a comprehensive testing framework that lets you write unit tests for functions, mock dependencies, and test API endpoints using Supertest."
  },
  {
    id: 25,
    title: "API Documentation with Swagger",
    content: "OpenAPI and Swagger tools automatically generate interactive documentation for RESTful endpoints based on schema definitions in code."
  }
    ];
    res.send(jokes);
})

const port = process.env.PORT || 3000;

app.listen(port,() => {
    console.log(`server is running at http://localhost:${port}`);
})