const inquirer = require('inquirer');
const mysql = require('mysql2');
const cTable = require('console.table');
const util = require('util');

const db = mysql.createConnection(
    {
      host: 'localhost',
      user: 'root',
      password: 'safely disposed danger',
      database: 'employee_db'
    },
    console.log(`Connected to the employee_db database.`)
  );

db.connect();
db.query = util.promisify(db.query);

const viewTable = async (query) => {
    const table = await db.query(query);
    console.log("\n")
    console.table(table);

    standby();

}

const addDept = async () => {
    await inquirer
        .prompt([
            {
                type: "input",
                message: "What is the name of the department?",
                name: "dept_name",
            }
        ])
        .then(data => {
            db.query(`
                INSERT INTO department(name)
                VALUES ("${data.dept_name}")`)
                console.log(`Added ${data.dept_name} to the database`)

            standby();
        })
}

const addRole = async () => {
    const deptQuery = await db.query(`SELECT * FROM department;`);
    const deptChoice = deptQuery.map(({id, name}) => ({
        name: name,
        value: id
    }));
    

    await inquirer
        .prompt([
            {
                type: "input",
                message: "What is the name of the role?",
                name: "role_name"
            },
            {
                type: "number",
                message: "What is the salary of the role?",
                name: "role_salary"
            },
            {
                type: "list",
                message: "What department does the role belong to?",
                name: "dept_id",
                choices: deptChoice
            }
        ])
        .then(data => {
            db.query(`
                INSERT INTO role(title, salary, department_id)
                VALUES ("${data.role_name}", ${data.role_salary}, ${data.dept_id})`);
            console.log(`Added ${data.role_name} to the database`)

            standby();
        })
}

const addEmployee = async () => {
    const roleQuery = await db.query(`SELECT id, title FROM role`);
    const roleArr = roleQuery.map(({id, title}) => ({
        name: title,
        value: id
    }));
    const managerQuery = await db.query(`SELECT e.id, CONCAT(e.first_name, ' ', e.last_name) manager FROM employee e WHERE manager_id IS NULL;`);
    const managerArr = managerQuery.map(({id, manager}) => ({
        name: manager,
        value: id
    }));
    managerArr.unshift({name: "None", value: null})

    await inquirer
        .prompt([
            {
                type: "input",
                message: "What is the employee's first name?",
                name: "first_name"
            },
            {
                type: "input",
                message: "What is the employee's last name?",
                name: "last_name"
            },
            {
                type: "list",
                message: "What is the employee's role?",
                name: "role",
                choices: roleArr
            },
            {
                type: "list",
                message: "Who is the employee's manager?",
                name: "manager",
                choices: managerArr
            }
        ])
        .then(data => {
            db.query(`INSERT INTO employee(first_name, last_name, role_id, manager_id)
                    VALUES ("${data.first_name}", "${data.last_name}", ${data.role}, ${data.manager});`);
            console.log(`Added ${data.first_name}  ${data.last_name} to the database`);

            standby();
        })
}

const standby = async () => {
    const input = await inquirer
        .prompt([
            {
                type: "list",
                message: "What would you like to do?",
                name: "choice",
                choices: [
                            "View All Departments",
                            "View All Roles",
                            "View All Employees",
                            "Add Department",
                            "Add Role",
                            "Add Employee",
                            "Update Employee Role",
                            "Exit"
                        ]
            }
        ])
        .then(val => {
            if (val.choice === "View All Departments") {
                viewTable(`SELECT * FROM department`);
            }
            else if (val.choice === "View All Roles") {
                viewTable(`
                SELECT 
                    role.id,
                    role.title,
                    department.name AS department,
                    role.salary
                FROM role
                JOIN department 
                ON department.id = role.department_id;`);
            }
            else if (val.choice === "View All Employees") {
                viewTable(`
                SELECT
                e.id,
                    e.first_name,
                    e.last_name,
                    role.title AS title,
                    department.name AS department,
                    role.salary,
                    CONCAT(m.first_name, ' ', m.last_name) manager
                FROM
                    employee e
                JOIN role
                    ON e.role_id = role.id
                JOIN department 
                    ON department.id = role.department_id
                LEFT OUTER JOIN employee AS m
                    ON e.manager_id = m.id;`);
            }
            else if (val.choice === "Add Department") {
                addDept();
            }
            else if (val.choice === "Add Role") {
                addRole();
            }
            else if (val.choice === "Add Employee") {
                addEmployee();
            }
            else if (val.choice !== "Exit") {
                console.log("NOT IMPLEMENTED YET")
            }
            else {
                process.exit(0);
            }

        })
}

const init = async () => {
    console.log("Employee Tracker Program - Replace with something fancier later")
    console.log("Hello mo, goodbye mo.");
    
    standby();
}

init();

/*
    TODO:
    * Update an Employee Role
     
    Optional:

    * Update employee managers
    * View employees by managers
    * View employees by department
    * Delete departments, roles and employees
    * View combined salary of a department
*/