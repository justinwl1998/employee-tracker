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

const updateEmployeeRole = async () => {
    const employeeQuery = await db.query(`SELECT e.id, CONCAT(e.first_name, ' ', e.last_name) name FROM employee e;`);
    const employeeArr = employeeQuery.map(({id, name}) => ({
        name: name,
        value: id
    }));
    const roleQuery = await db.query(`SELECT id, title FROM role`);
    const roleArr = roleQuery.map(({id, title}) => ({
        name: title,
        value: id
    }));

    await inquirer
        .prompt([
            {
                type: "list",
                message: "Which employee's role do you want to update?",
                name: "id",
                choices: employeeArr
            },
            {
                type: "list",
                message: "Which role do you want to assign the selected employee?",
                name: "newRole",
                choices: roleArr
            }
        ])
        .then(data => {
            db.query(`UPDATE employee SET role_id = ${data.newRole} WHERE id = ${data.id};`);
            console.log("Updated employee's role");

            standby();
        })
}

const updateManagers = async () => {
    const employeeQuery = await db.query(`SELECT e.id, CONCAT(e.first_name, ' ', e.last_name) name FROM employee e;`);
    let employeeArr = employeeQuery.map(({id, name}) => ({
        name: name,
        value: id
    }));

    const emp = await inquirer
        .prompt([
            {
                type: "list",
                message: "Select which employee to update their manager.",
                name: "id",
                choices: employeeArr
            }
        ])

    // Update the choice array to not include the employee selected before
    employeeArr = employeeArr.filter(em => em.value !== emp.id);
    employeeArr.unshift({name: "None", value: null});

    await inquirer
        .prompt([
            {
                type: "list",
                message: "Select which manager manages this employee.",
                name: "manager",
                choices: employeeArr
            }
        ])
        .then(data => {
            db.query(`UPDATE employee SET manager_id = ${data.manager} WHERE id = ${emp.id};`);
            console.log("Updated employee's manager");

            standby();
        })
}

const viewEmployeesByManager = async () => {
    const managerQuery = await db.query(`SELECT e.id, CONCAT(e.first_name, ' ', e.last_name) manager FROM employee e WHERE manager_id IS NULL;`);
    const managerArr = managerQuery.map(({id, manager}) => ({
        name: manager,
        value: id
    }));
    
    await inquirer
        .prompt([
            {
                type: "list",
                message: "Select which manager to view what employees they manage.",
                name: "manager",
                choices: managerArr
            }
        ])
        .then(data => {
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
                ON e.manager_id = m.id
            WHERE
                e.manager_id = ${data.manager};`)
        })
}

const viewEmployeesByDept = async () => {
    const deptQuery = await db.query(`SELECT * FROM department;`);
    const deptChoice = deptQuery.map(({id, name}) => ({
        name: name,
        value: id
    }));

    await inquirer
        .prompt([
            {
                type: "list",
                message: "Select which department to view the employees working in it.",
                choices: deptChoice,
                name: "dept"
            }
        ])
        .then(data => {
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
                ON e.manager_id = m.id
            WHERE
                department.id = ${data.dept};
            `)
        });
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
                            "Update Employee Managers",
                            "View Employees by Manager",
                            "View Employees by Department",
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
            else if (val.choice === "Update Employee Role") {
                updateEmployeeRole();
            }
            else if (val.choice === "Update Employee Managers") {
                updateManagers();
            }
            else if (val.choice === "View Employees by Manager") {
                viewEmployeesByManager();
            }
            else if (val.choice === "View Employees by Department") {
                viewEmployeesByDept();
            }
            else if (val.choice !== "Exit") {
                console.log("NOT IMPLEMENTED YET")
                standby();
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

    Optional:
    * Delete departments, roles and employees
    * View combined salary of a department
*/