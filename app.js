const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const updateStatus = (requestBody) => {
  return requestBody.status !== undefined;
};
const upDatePriority = (requestBody) => {
  return requestBody.priority !== undefined;
};
const upDateTodo = (requestBody) => {
  return requestBody.todo !== undefined;
};

// API 1 Returns a list of all todos whose status is 'TO DO'
app.get("/todos/", async (request, response) => {
  let getTodosListQuery = "";
  let result = null;
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosListQuery = `
          SELECT *FROM
            todo
          WHERE 
          todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosListQuery = `
          SELECT *FROM
            todo
          WHERE 
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosListQuery = `
          SELECT *FROM
            todo
          WHERE 
          todo LIKE '%${search_q}%'
          AND status = '${status}';`;
      break;
    default:
      getTodosListQuery = `
          SELECT *FROM
            todo
          WHERE 
          todo LIKE '%${search_q}%';`;
      break;
  }
  result = await db.all(getTodosListQuery);
  response.send(result);
});

//API 2 Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificIdQuery = `
    SELECT * FROM 
        todo
    WHERE id = '${todoId}';`;
  const todoRequested = await db.get(getSpecificIdQuery);
  response.send(todoRequested);
});

//API 3 Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addNewTodoQuery = `
    INSERT INTO 
        todo(id, todo, priority, status)
    VALUES
        ('${id}','${todo}','${priority}','${status}');`;
  const newTodo = await db.run(addNewTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4 Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateTodoQuery = "";
  let dbResponse = null;

  const getPreviousTodo = `
    SELECT * FROM todo
    WHERE id= '${todoId}';`;
  const previousTodo = await db.get(getPreviousTodo);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  switch (true) {
    case updateStatus(request.body):
      updateTodoQuery = `
            UPDATE 
                todo
            SET 
                status= '${status}'
            WHERE id='${todoId}';`;
      dbResponse = await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case upDatePriority(request.body):
      updateTodoQuery = `
            UPDATE 
                todo
            SET 
                priority= '${priority}'
            WHERE id='${todoId}';`;
      dbResponse = await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case upDateTodo(request.body):
      updateTodoQuery = `
            UPDATE 
                todo
            SET 
                todo= '${todo}'
            WHERE id='${todoId}';`;
      dbResponse = await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

// API 5 Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = '${todoId}';`;
  const deletedTodo = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
