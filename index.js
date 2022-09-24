const inquirer = require('inquirer');
const mysql = require('mysql2');
const cTable = require('console.table');

const db = mysql.createConnection(
    {
      host: 'localhost',
      user: 'root',
      password: 'safely disposed danger',
      database: 'employee_db'
    },
    console.log(`Connected to the employee_db database.`)
  );

db.connect((err) => {
    if (err) {
        throw err;
    }
})

const viewAllDepartments = () => {
    db.query(`SELECT * FROM department`, function(err, results) {
        console.table(results)
    })
}

const viewAllRoles = () => {
    db.query(`
    SELECT 
        role.id,
        role.title,
	    department.name AS department,
	    role.salary
    FROM role
    JOIN department 
	ON department.id = role.department_id;`, function(err, results) {
        console.table(results);
    })
}

const standby = () => {
    inquirer
        .prompt([
            {
                type: "list",
                message: "What would you like to do?",
                name: "choice",
                choices: ["View All Departments",
                            "View All Roles",
                            "View All Employees",
                            "Add Department",
                            "Add Role",
                            "Add Employee",
                            "Update Employee Role",
                            "Exit"]
            }
        ])
        .then(val => {
            if (val.choice === "View All Departments") {
                viewAllDepartments();
            }
            else if (val.choice === "View All Roles") {
                viewAllRoles();
            }
            else if (val.choice !== "Exit") {
                console.log("NOT IMPLEMENTED YET")
            }
            else {
                process.exit(0);
            }

            setTimeout(() => {
                standby()
            }, 1000);
        })

        // const result = await viewAllDepartments();
        // console.log(result)
}

const init = async () => {
    console.log("Employee Tracker Program - Replace with something fancier later")
    console.log("Hello mo, goodbye mo.");
    
    standby();
}

init();

/*
    TODO:

    * Add View All Departments (done)
    * View All Roles (done)
    * View All Employees
    * Add a Department
    * Add a Role
    * Add an Employee
    * Update an Employee Role
*/