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
  }
  ```
  - Note: `password` is not returned because the schema sets password `select: false`.

- 400 Bad Request
  - Returned when request validation fails.
  - Example:
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

- Route: `Backend/routes/user.routes.js`
- Controller: `Backend/controller/user.controller.js` (`registerUser`)
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

Example:

```json
{
  "password": "pa$$w0rd"
}
```

- `password` — minimum length 6.
### Responses
  ## GET /users/profile

  Returns the authenticated user's profile. This endpoint is protected and requires a valid JWT (the project uses an `authMiddleware.authUser` to populate `req.user`).

  Mounted at `/users` (see `Backend/routes/user.routes.js`).

  ### Description

  - Requires authentication via the `authMiddleware.authUser` middleware.
  - `authMiddleware` should validate the JWT (from cookie or Authorization header), load the user, and attach the user object to `req.user`.
  - The controller returns the data available on `req.user` (the controller currently returns `res.status(200).json(req.user)`).

  ### Endpoint

  GET /users/profile

  ### Request

  - No body. The request must include authentication (cookie named `token` or `Authorization: Bearer <token>` header depending on your client).

  ### Responses

  - 200 OK
    - Body: the user object (example):
    ```json
    {
      "_id": "<userId>",
      "fullname": { "firstname": "John", "lastname": "Doe" },
      "email": "john.doe@example.com",
      "socketId": null
    }
    ```

  - 401 Unauthorized
    - Returned when the token is missing, invalid, or expired.
    - Example:
    ```json
    { "message": "Authentication required" }
    ```

  - 500 Internal Server Error
    - For unexpected errors while validating the token or loading the user.

  ### Implementation notes / references

  - Route: `Backend/routes/user.routes.js` (uses `authMiddleware.authUser`)
  - Controller: `Backend/controller/user.controller.js` (`getUserProfile`)
  - Middleware: `Backend/middlewares/auth.middleware.js` (validates JWT and attaches user to `req.user`)

  ---

  ## GET /users/logout

  Logs out the authenticated user by clearing the auth cookie and blacklisting the JWT so it can't be reused.

  Mounted at `/users` (see `Backend/routes/user.routes.js`).

  ### Description

  - Clears the `token` cookie (if set) and attempts to retrieve the token from either cookies or the `Authorization` header.
  - When a token is found, the controller saves it in the `blacklistToken` collection so it can no longer be used for authentication.

  ### Endpoint

  GET /users/logout

  ### Request

  - No body. Must be called by an authenticated user (the route uses `authMiddleware.authUser`).

  ### Responses

  - 200 OK
    - Body:
    ```json
    { "message": "Logged out successfully" }
    ```

  - 400 Bad Request
    - Possible when no token is present to blacklist (controller currently treats empty token gracefully and still returns 200 after clearing cookies).

  - 500 Internal Server Error
    - For unexpected errors saving the blacklisted token.

  ### Implementation notes / references

  - Route: `Backend/routes/user.routes.js` (uses `authMiddleware.authUser`)
  - Controller: `Backend/controller/user.controller.js` (`logoutUser`)
  - Model: `Backend/models/blacklistToken.model.js` (used to store blacklisted tokens)

  Security note: Blacklisting tokens in the DB is an effective short-term mitigation. Consider adding token expiry handling and index the blacklist collection on token and createdAt for efficient lookups.


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

---

## Captain endpoints

The captain-related routes are mounted at `/captains` (see `Backend/app.js`). The project currently exposes a registration endpoint for captains under `/captains/register`.

### POST /captains/register

Register a new captain (driver). Validates input, hashes the password, creates the captain record and returns a JWT with the created captain.

Endpoint: POST /captains/register

Request body (application/json)

- `fullname`: object
  - `firstname` (string, required, min length 3)
  - `lastname` (string, optional)
- `email` (string, required, valid email)
- `password` (string, required, min length 6)
- `vehicle`: object
  - `color` (string, required, min length 3)
  - `plate` (string, required, min length 3)
  - `capacity` (integer, required, min 1)
  - `vehicleType` (string, required, one of `bike`, `car`, `auto`)

Example request

```json
{
  "fullname": { "firstname": "Jane", "lastname": "Rider" },
  "email": "jane.rider@example.com",
  "password": "pa$$w0rd",
  "vehicle": {
    "color": "red",
    "plate": "ABC-123",
    "capacity": 2,
    "vehicleType": "car"
  }
}
```

Validation rules

- `fullname.firstname` — min length 3 (express-validator rule in `Backend/routes/captain.routes.js`).
- `email` — must be a valid email.
- `password` — min length 6.
- `vehicle.color` — min length 3.
- `vehicle.plate` — min length 3.
- `vehicle.capacity` — integer, min 1.
- `vehicle.vehicleType` — one of `bike`, `car`, `auto`.

Responses

- 201 Created
  - Body:
  ```json
  {
    "token": "<jwt-token>",
    "newCaptain": {
      "_id": "<captainId>",
      "fullname": { "firstname": "Jane", "lastname": "Rider" },
      "email": "jane.rider@example.com",
      "vehicle": { "color": "red", "plate": "ABC-123", "capacity": 2, "vehicleType": "car" },
      "status": "inactive",
      "socketId": null
    }
  }
  ```

- 400 Bad Request
  - Returned for validation errors (express-validator) or if a captain with the same email already exists. Example validation response:
  ```json
  { "errors": [ { "msg": "firstname must be at least 3 characters long", "param": "fullname.firstname" } ] }
  ```

- 500 Internal Server Error
  - For unexpected DB or server errors.

Implementation notes / references

- Route: `Backend/routes/captain.routes.js`
- Controller: `Backend/controller/captain.controller.js` (`registerCaptain`)
- Service: `Backend/services/captain.service.js` (creates the captain record )
- Model: `Backend/models/captain.model.js` (`generateAuthToken`, `comparePassword`, `hashPassword`)

Notes and recommendations

- The current controller checks for an existing captain via `captainModel.findOne({ email })` and responds with 400 and message `Captain with this email already exists` when found.
- The service hashes the password before saving (the controller also attempts to hash — review to avoid double hashing).
- Consider returning the created captain object with the `password` field removed (the schema sets `password.select = false`, but ensure responses do not accidentally include it).
- Add indexes on `email` and `vehicle.plate` for uniqueness and faster lookups.

---

### Captain auth & profile endpoints (examples)

Below are JSON request and response examples for captain authentication and profile endpoints. The JSON examples include inline comments (JSONC-style) describing validation requirements and notes — the comments are for documentation purposes and are not valid JSON if copied directly into a JSON parser.

#### POST /captains/login

Request body (JSON with comments):

```jsonc
{
  "email": "jane.rider@example.com", // required, must be a valid email
  "password": "pa$$w0rd" // required, min length 6
}
```

Successful response (200 OK):

```jsonc
{
  "token": "<jwt-token>",
  "captain": {
    "_id": "<captainId>",
    "fullname": { "firstname": "Jane", "lastname": "Rider" },
    "email": "jane.rider@example.com",
    "vehicle": { "color": "red", "plate": "ABC-123", "capacity": 2, "vehicleType": "car" },
    "status": "inactive", // one of 'active', 'inactive', 'on-trip'
    "socketId": null
  }
}
```

Error responses:

```jsonc
// 400 Bad Request - validation error
{ "errors": [ { "msg": "Please provide a valid email address", "param": "email" } ] }

// 401 Unauthorized - invalid credentials
{ "message": "Invalid email or password" }
```

Notes:
- The login controller must query the model including the password field: `captainModel.findOne({ email }).select('+password')` so `comparePassword` can access the hashed password.
- Remove the `password` property from the captain object before returning it to the client (e.g. `captain.password = undefined`) to avoid leaking the hash.

#### GET /captains/profile

No request body. Authentication is required (cookie `token` or `Authorization: Bearer <token>`).

Successful response (200 OK):

```jsonc
{
  "captain": {
    "_id": "<captainId>",
    "fullname": { "firstname": "Jane", "lastname": "Rider" },
    "email": "jane.rider@example.com",
    "vehicle": { "color": "red", "plate": "ABC-123", "capacity": 2, "vehicleType": "car" },
    "status": "inactive",
    "socketId": null
  }
}
```

Error responses:

```jsonc
// 401 Unauthorized - missing/invalid token
{ "message": "Authentication required" }

// 500 Internal Server Error - token validation or DB lookup failure
{ "message": "Internal server error" }
```

Notes:
- This route uses `authMiddleware.authCaptain` to validate the token and attach the captain to `req.captain` (see `Backend/middlewares/auth.middleware.js`).

#### GET /captains/logout

No request body. Must be called by an authenticated captain.

Successful response (200 OK):

```json
{
  "message": "Logged out successfully"
}
```

Behavior and notes:
- The logout handler clears the `token` cookie and stores the token in the `blacklistToken` collection so it can no longer be used.
- If no token is present the controller currently still clears cookies and returns success; you may wish to return 400 when no token is available.
- Example server-side steps:
  1. Get token from `req.cookies.token` or `Authorization` header.
  2. Save token to `blacklistToken` collection: `blacklistTokenModel.create({ token })`.
  3. Clear cookie: `res.clearCookie('token')` and return 200.

---

If you'd like, I can also:
- Convert these JSONC examples into separate files under a `docs/` folder for machine-readable examples.
- Add curl/PowerShell samples for each endpoint.
- Implement a small test to verify login/profile/logout flows for captains.












