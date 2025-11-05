# POST /users/register

Creates a new user and returns an auth token plus the created user.

The endpoint is mounted at `/users` (see `Backend/routes/user.routes.js`).

## Description

- Validates request body, hashes the password, saves the user, and returns a JWT.
- Validation is performed in the route (`user.controller.registerUser` uses `express-validator`).
- Password hashing and token generation use methods on the model (`user.model.hashPassword`, `user.model.generateAuthToken`).
- User creation logic lives in `user.service.createUser`.

## Endpoint

POST /users/register

## Request body (application/json)

- `fullname`: object
  - `firstname` (string, required, min length 3)
  - `lastname` (string, optional)
- `email` (string, required, must be a valid email)
- `password` (string, required, min length 6)

Example:

```json
{
  "fullname": {
    "firstname": "John",
    "lastname": "Doe"
  },
  "email": "john.doe@example.com",
  "password": "pa$$w0rd"
}
```

## Validation rules

- `email` — must be a valid email (route validator in `Backend/routes/user.routes.js`).
- `fullname.firstname` — minimum length 3.
- `password` — minimum length 6.
- Model-level rules (see `Backend/models/user.model.js`) also enforce `fullname.firstname` and `email` constraints.

## Responses

- 201 Created
  - Body:
  ```json
  {
    "token": "<jwt-token>",
    "user": {
      "_id": "<userId>",
      "fullname": { "firstname": "John", "lastname": "Doe" },
      "email": "john.doe@example.com",
      "socketId": null
    }
  }
  ```
  - Note: `password` is not returned because the schema sets password `select: false`.

- 400 Bad Request
  - Returned when request validation fails.
  - Example:
  ```json
  {
    "errors": [
      { "msg": "Invalid Email", "param": "email" },
      { "msg": "First name must be at least 3 characters long", "param": "fullname.firstname" }
    ]
  }
  ```

- 409 Conflict
  - Possible when the email is already registered (Mongo duplicate key error). Not explicitly handled in current service — will surface as a server error unless caught.

- 500 Internal Server Error
  - For unexpected errors during hashing, DB save, or token generation.

## Implementation notes / references

- Route: `Backend/routes/user.routes.js`
- Controller: `Backend/controller/user.controller.js` (`registerUser`)
- Service: `Backend/services/user.service.js` (`createUser`)
- Model: `Backend/models/user.model.js` (`hashPassword`, `generateAuthToken`)

---

## POST /users/login

Authenticate a user with email and password. Returns a JWT and the user object on success.

Mounted at `/users` (see `Backend/routes/user.routes.js`).

### Description

- Validates request body and checks credentials.
- Loads the user including the hashed password using `findOne({ email }).select("+password")`, compares the provided password with `comparePassword`, and generates a JWT on success.

### Endpoint

POST /users/login

### Request body (application/json)

- `email` (string, required, must be a valid email)
- `password` (string, required, min length 6)

Example:

```json
{
  "email": "john.doe@example.com",
  "password": "pa$$w0rd"
}
```

### Validation rules

- `email` — must be a valid email (route validator in `Backend/routes/user.routes.js`).
- `password` — minimum length 6.

### Responses

- 200 OK
  - Body:
  ```json
  {
    "token": "<jwt-token>",
    "user": {
      "_id": "<userId>",
      "fullname": { "firstname": "John", "lastname": "Doe" },
      "email": "john.doe@example.com",
      "socketId": null
    }
  }
  ```
  - Note: the current controller uses `select("+password")` to validate credentials; depending on how the controller is implemented it may include the hashed `password` field in the returned `user` object. It's recommended to remove the `password` field from the user before sending the response (e.g. `user.password = undefined`) to avoid leaking it.

- 400 Bad Request
  - Returned when request validation fails. Example:
  ```json
  {
    "errors": [ { "msg": "Invalid Email", "param": "email" } ]
  }
  ```

- 401 Unauthorized
  - Returned when the email does not exist or the password is incorrect. Example:
  ```json
  { "message": "Invalid email or password" }
  ```

- 500 Internal Server Error
  - For unexpected errors during DB access, password comparison, or token generation.

### Implementation notes / references

- Route: `Backend/routes/user.routes.js`
- Controller: `Backend/controller/user.controller.js` (`loginUser`)
- Model: `Backend/models/user.model.js` (uses `comparePassword`, `generateAuthToken`)

