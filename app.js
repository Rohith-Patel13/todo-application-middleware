const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format, addDays, differenceInDays, parse } = require("date-fns");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let dbConnectionObject = null;

const initializeDBAndServer = async () => {
  try {
    dbConnectionObject = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const todoValidation = async (requestObject, responseObject, next) => {
  let todoQuery = "";
  let dbResponse = null;

  const requestObjectQuery = requestObject.query;
  const { priority, status, category, date } = requestObjectQuery;
  let isValidQuery = true;

  if (status !== undefined) {
    todoQuery = `SELECT * FROM todo WHERE status='${status}';`;
    dbResponse = await dbConnectionObject.all(todoQuery);
    console.log(dbResponse.length);
    if (dbResponse.length === 0) {
      isValidQuery = false;
      responseObject.status(400);
      responseObject.send("Invalid Todo Status");
      return;
    }
  }

  if (priority !== undefined) {
    todoQuery = `SELECT * FROM todo WHERE priority='${priority}';`;
    dbResponse = await dbConnectionObject.all(todoQuery);
    console.log(dbResponse.length);
    if (dbResponse.length === 0) {
      isValidQuery = false;
      responseObject.status(400);
      responseObject.send("Invalid Todo Priority");
      return;
    }
  }
  if (category !== undefined) {
    todoQuery = `SELECT * FROM todo WHERE category='${category}';`;
    dbResponse = await dbConnectionObject.all(todoQuery);
    console.log(dbResponse.length);
    if (dbResponse.length === 0) {
      isValidQuery = false;
      responseObject.status(400);
      responseObject.send("Invalid Todo Category");
      return;
    }
  }

  if (date !== undefined) {
    let parsedDate;
    console.log(parsedDate); //undefined
    let formattedDate;
    console.log(formattedDate); //undefined
    console.log(date);
    try {
      parsedDate = parse(date, "yyyy-M-dd", new Date());
      formattedDate = format(parsedDate, "yyyy-MM-dd");
    } catch (error) {
      responseObject.status(400);
      responseObject.send("Invalid Due Date");
      return;
    }
    todoQuery = `SELECT * FROM todo WHERE due_date='${formattedDate}';`;
    dbResponse = await dbConnectionObject.all(todoQuery);
    console.log(dbResponse.length);
    if (dbResponse.length === 0) {
      isValidQuery = false;
      responseObject.status(400);
      responseObject.send("Invalid Due Date");
      return;
    }
  }

  if (isValidQuery) {
    console.log("calling handler function using next");
    next();
  }
};

const todoValidationCreate = (requestObject, responseObject, next) => {
  const requestObjectBody = requestObject.body;
  const { id, todo, priority, status, category, dueDate } = requestObjectBody;
  let isValidQuery = true;
  /*
  const possiblePriority = [`HIGH`, `MEDIUM`, `LOW`];
  const possibleStatus = [`TO DO`, `IN PROGRESS`, `DONE`];
  const possibleCategory = [`WORK`, `HOME`, `LEARNING`];
  */
  console.log(dueDate);
  const parsedDate = parse(dueDate, "yyyy-MM-dd", new Date());
  console.log(parsedDate); //2021-02-22T00:00:00.000Z
  console.log(typeof parsedDate); //object
  const formattedDate = format(parsedDate, "yyyy-MM-dd");

  if (status === undefined) {
    isValidQuery = false;
    responseObject.send("Invalid Todo Status");
    return;
  }
  if (priority === undefined) {
    isValidQuery = false;
    responseObject.send("Invalid Todo Priority");
    return;
  }
  if (category === undefined) {
    isValidQuery = false;
    responseObject.send("Invalid Todo Category");
    return;
  }
  if (dueDate === undefined) {
    isValidQuery = false;
    responseObject.send("Invalid Due Date");
    return;
  }
  if (isValidQuery) {
    console.log("post method next handler");
    next();
  }

  /*
  
  if (!possiblePriority.includes(priority) || typeof priority !== "string") {
    isValidQuery = false;
    responseObject.send("Invalid Todo Priority");
    return;
  }
  if (!possibleStatus.includes(status) || typeof status !== "string") {
    isValidQuery = false;
    responseObject.send("Invalid Todo Status");
    return;
  }
  if (!possibleCategory.includes(category) || typeof status !== "string") {
    isValidQuery = false;
    responseObject.send("Invalid Todo Category");
    return;
  }
  if (typeof formattedDate !== "string") {
    isValidQuery = false;
    responseObject.send("Invalid Due Date");
    return;
  }
  if (isValidQuery) {
    console.log("post method next handler");
    next();
  }
  /*
  console.log(requestObjectBody);
{
  id: 6,
  todo: 'Finalize event theme',
  priority: 'LOW',
  status: 'TO DO',
  category: 'HOME',
  dueDate: '2021-02-22'
}

  */
};

//API 1 scenarios:
const scenario1 = (requestObjectQuery) => {
  console.log("scenario1");
  return (
    requestObjectQuery.status !== undefined &&
    requestObjectQuery.priority === undefined &&
    requestObjectQuery.category === undefined
  );
};

const scenario2 = (requestObjectQuery) => {
  console.log("scenario2");
  return (
    requestObjectQuery.status === undefined &&
    requestObjectQuery.priority !== undefined &&
    requestObjectQuery.category === undefined
  );
};
const scenario3 = (requestObjectQuery) => {
  console.log("scenario3");
  return (
    requestObjectQuery.priority !== undefined &&
    requestObjectQuery.status !== undefined &&
    requestObjectQuery.category === undefined
  );
};
const scenario4 = (requestObjectQuery) => {
  console.log("scenario4");

  return (
    requestObjectQuery.category !== undefined &&
    requestObjectQuery.status !== undefined &&
    requestObjectQuery.priority === undefined
  );
};
const scenario5 = (requestObjectQuery) => {
  console.log("scenario5");

  return (
    requestObjectQuery.status === undefined &&
    requestObjectQuery.priority === undefined &&
    requestObjectQuery.category !== undefined
  );
};
const scenario6 = (requestObjectQuery) => {
  console.log("scenario6");

  return (
    requestObjectQuery.status === undefined &&
    requestObjectQuery.priority !== undefined &&
    requestObjectQuery.category !== undefined
  );
};

app.get("/todos/", todoValidation, async (requestObject, responseObject) => {
  let queryTodo = "";
  let dbResponse = null;
  const requestObjectQuery = requestObject.query;
  const { search_q = "", priority, status, category } = requestObjectQuery;
  console.log(requestObjectQuery);

  switch (true) {
    case scenario1(requestObjectQuery):
      //console.log(typeof priority); //undefined
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND status='${status}';`;
      console.log("1st query");
      break;

    case scenario2(requestObjectQuery):
      /*
      //console.log(typeof status); //"undefined"
        The typeof operator in JavaScript is used to determine the data type
      of a given value. When applied to the primitive value undefined, 
      it returns the string "undefined". This is because undefined is indeed 
      a primitive type in JavaScript and represents the absence of a meaningful value.
      */

      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority='${priority}';`;
      console.log("2nd query");
      break;
    case scenario3(requestObjectQuery):
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority='${priority}' AND status='${status}';`;
      console.log("3rd query");
      break;
    case scenario4(requestObjectQuery):
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND category='${category}' AND status='${status}';`;
      console.log("4th query");
      break;
    case scenario5(requestObjectQuery):
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND category='${category}';`;
      console.log("5th query");
      break;
    case scenario6(requestObjectQuery):
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND category='${category}' AND priority='${priority}';`;
      console.log("6th query");
      break;

    default:
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
      console.log("default query scenario");
      break;
  }

  dbResponse = await dbConnectionObject.all(queryTodo);
  const dbResponseResultArray = dbResponse.map((eachObject) => {
    return {
      id: eachObject.id,
      todo: eachObject.todo,
      priority: eachObject.priority,
      status: eachObject.status,
      category: eachObject.category,
      dueDate: eachObject.due_date,
    };
  });

  responseObject.send(dbResponseResultArray);
});

//API 2:
app.get(
  "/todos/:todoId/",
  todoValidation,
  async (requestObject, responseObject) => {
    const todoIdObject = requestObject.params;

    const { todoId } = todoIdObject;
    //const requestBody = requestObject.body;
    //console.log(requestBody);//{}
    const todoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
    const dbResponse = await dbConnectionObject.get(todoQuery);
    //console.log(dbResponse);
    const { id, todo, priority, status, category, due_date } = dbResponse;
    const dbResponseResult = {
      id: id,
      todo: todo,
      priority: priority,
      status: status,
      category: category,
      dueDate: due_date,
    };

    responseObject.send(dbResponseResult);
  }
);

//API 3:
app.get("/agenda/", todoValidation, async (requestObject, responseObject) => {
  const todoIdObject = requestObject.query;
  const { date } = todoIdObject;
  console.log(date); //2021-2-22
  console.log(typeof date); //string
  const parsedDate = parse(date, "yyyy-M-dd", new Date());

  console.log(parsedDate); //2021-02-22T00:00:00.000Z
  console.log(typeof parsedDate); //object
  const formattedDate = format(parsedDate, "yyyy-MM-dd");
  console.log(formattedDate); //2021-02-22
  console.log(typeof formattedDate); //string

  const todoQuery = `SELECT * FROM todo WHERE due_date='${formattedDate}';`;
  const dbResponse = await dbConnectionObject.all(todoQuery);
  console.log(dbResponse);
  const { id, todo, priority, status, category, due_date } = dbResponse;
  const dbResponseResult = dbResponse.map((eachObject) => {
    return {
      id: eachObject.id,
      todo: eachObject.todo,
      priority: eachObject.priority,
      status: eachObject.status,
      category: eachObject.category,
      dueDate: eachObject.due_date,
    };
    console.log(dbResponseResult);
  });
  responseObject.send(dbResponseResult);
});

//API 4:
app.post(
  "/todos/",
  todoValidationCreate,
  async (requestObject, responseObject) => {
    const requestBody = requestObject.body;
    /*
  {
  "id": 6,
  "todo": "Finalize event theme",
  "priority": "LOW",
  "status": "TO DO",
  "category": "HOME",
  "dueDate": "2021-02-22"
}
  */

    /*
  console.log(requestBody);
  output for requestBody:
  {
  id: 6,
  todo: 'Finalize event theme',
  priority: 'LOW',
  status: 'TO DO',
  category: 'HOME',
  dueDate: '2021-02-22'
}
 
  */
    /*
| Column   | Type    |
| -------- | ------- |
| id       | INTEGER |
| todo     | TEXT    |
| category | TEXT    |
| priority | TEXT    |
| status   | TEXT    |
| due_date | DATE    |
 */

    const { id, todo, priority, status, category, dueDate } = requestBody;
    const parsedDate = parse(dueDate, "yyyy-MM-dd", new Date());

    console.log(parsedDate); //2021-02-22T00:00:00.000Z
    console.log(typeof parsedDate); //object
    const formattedDate = format(parsedDate, "yyyy-MM-dd");
    const todoQuery = `
  INSERT INTO todo(id, todo, category,priority,status,due_date )
  VALUES(${id},'${todo}','${category}','${priority}','${status}','${formattedDate}');
  `;
    await dbConnectionObject.run(todoQuery);
    responseObject.send("Todo Successfully Added");
  }
);

//API 5 scenarios:
const statusScenario1 = (requestBody) => {
  return requestBody.hasOwnProperty("status");
};
const priorityScenario2 = (requestBody) => {
  return requestBody.hasOwnProperty("priority");
};
const priorityScenario3 = (requestBody) => {
  return requestBody.hasOwnProperty("todo");
};
const priorityScenario4 = (requestBody) => {
  return requestBody.hasOwnProperty("category");
};
app.put(
  "/todos/:todoId/",
  todoValidation,
  async (requestObject, responseObject) => {
    let dbResponse = null;
    let sendingText = "";
    let todoQuery = "";
    const todoIdObject = requestObject.params;
    const { todoId } = todoIdObject;
    const requestBody = requestObject.body;
    const { status, priority, todo, category, dueDate } = requestBody;
    switch (true) {
      case statusScenario1(requestBody):
        console.log("1st query");
        sendingText = "Status Updated";
        todoQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
        break;
      case priorityScenario2(requestBody):
        console.log("2nd query");
        sendingText = "Priority Updated";
        todoQuery = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
        break;
      case priorityScenario3(requestBody):
        console.log("3rd query");
        sendingText = "Todo Updated";
        todoQuery = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
        break;
      case priorityScenario4(requestBody):
        console.log("4th query");
        sendingText = "Category Updated";
        todoQuery = `UPDATE todo SET category='${category}' WHERE id=${todoId};`;
        break;

      default:
        console.log("5th query");
        sendingText = "Due Date Updated";
        todoQuery = `UPDATE todo SET due_date='${dueDate}' WHERE id=${todoId};`;
        break;
    }
    dbResponse = await dbConnectionObject.run(todoQuery);
    responseObject.send(sendingText);
  }
);

//API 6:
app.delete(
  "/todos/:todoId/",
  todoValidation,
  async (requestObject, responseObject) => {
    const todoIdObject = requestObject.params;
    const { todoId } = todoIdObject;
    const todoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
    await dbConnectionObject.run(todoQuery);
    responseObject.send("Todo Deleted");
  }
);
module.exports = app;
