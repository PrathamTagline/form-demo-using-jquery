$(function () {
    // take the elements by using ID selector and name selector (we can be said the use query to select the element by name)
    const form = $("#dataForm");
    let tableBody = $("#dataTable tbody");
    const state = $('[name="state"]');
    const city = $('[name="city"]');
    const searchInput = $('#search');

    // const or static variables 
    const DISABLED_OPTION = "<option disabled selected value>---- select city ----</option>";
    ACTIONS = { EDIT: "edit", DELETE: "delete" }; 

    // regular expressions
    const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let userDB = [];  // user database 
    let userIdCounter = 1; // incremental userID counter 
    let editingUserId = -1; // editing userID (currently -1 means not any user data which edited)

    // static state and its cities data
    const stateCities = {
        Gujarat: ["Ahmedabad", "Surat", "Bharuch", "Navsari"],
        Panjab: ["Mohali", "Ludhiana", "Amritsar"]
    };

    // change cities according to state and sort cities in ascending order
    state.on("change", function () {
        const cities = stateCities[state.val()]?.sort() || [];
        city.html(DISABLED_OPTION + jQuery.map(cities, function (city) { return `<option value="${city}">${city}</option>` }).join(""));
    });

    /* form submission event here 
    it checks if form data is valid or not 
    also checks if the email exists or not 

    after checking form validation it checks 
    whether the userID exists or not 
    if yes, edit the data (it must occur if the user clicks 
                           the edit button and after submitting,
                           data updates in the database)

    else (add the data to user database)
    */
    form.on("submit", function (event) {
        event.preventDefault();
        const userData = collectFormData();
        if (validateForm(userData)) {
            if (isEmailExist(userData.email)) {
                alert("This email is already in use. Please use a different email.");
                form.elements["email"].focus();
                return;
            }
            if (editingUserId !== -1) {
                updateUserData(editingUserId, userData);
                editingUserId = -1;
            } else {
                addNewUser(userData);
            }
        }
        form.trigger("reset");
        renderTable(userDB);
    });

    /*
        below event use for further edit and delete button events 
        
        if: someone clicks on the delete button, then data will be 
             deleted from the userDB and
        
        if: someone clicks on the edit button, then data will be 
             loaded into the form and someone might update it if needed.
             Also, the submit event has a condition to store updated 
             existing user data.    
    */
    tableBody.on("click", function (event) {
        const row = event.target.closest("tr");
        const userId = parseInt(row.dataset.userId, 10);
        if (event.target.classList.contains(ACTIONS.DELETE)) {
            deleteUser(userId);
            row.remove();
        } else if (event.target.classList.contains(ACTIONS.EDIT)) {
            loadUserDataForEditing(userId);
            row.remove();
        }
    });

    // search event when someone the trying to search a person by name 
    searchInput.on("input", tableFilter);



    /* validateForm function is used to verify 
       if the form data is valid or not */
    function validateForm(userdata) {

        // user data which need to varify
        let email = userdata.email;
        let age = userdata.age;

        let isValid = true;

        console.log(typeof gender)
        console.log(typeof hobbies)

        // check email is match with the regular expration
        if (!email.match(EMAIL_REGEXP)) {
            alert("Please enter a valid email address.");
            isValid = false;
        }
        // check age id under 1 to 120 or not 
        const ageValue = parseInt(age, 10);
        if (isNaN(ageValue) || ageValue < 1 || ageValue > 120) {
            alert("Please enter a valid age between 1 and 120.");
            isValid = false;
        }

        return isValid;
    }

    // check the same email is  exist in the database or not is than we can't enter the data to DB
    function isEmailExist(email) {
        return userDB.some(user => user.data.email === email && user.id !== editingUserId);
    }

    // collect data from the form and return the data object  
    function collectFormData() {
        let formData = form.serializeArray();
        const data = {};
        let hobbies = [];
        $.each(formData, function (i, field) {
            if (field.name === "hobbies") {
                hobbies.push(field.value);
            } else {
                data[field.name] = field.value;
            }

        });
        data.hobbies = hobbies;
        return data;
    }

    // append data to userDB
    function addNewUser(userData) {
        userDB.push({ id: userIdCounter++, data: userData });
    }

    // update existing user data in userDB
    function updateUserData(userId, updatedData) {
        const user = userDB.find(user => user.id === userId);
        if (user) user.data = updatedData;
    }

    // deleteing the user
    function deleteUser(userId) {
        userDB = userDB.filter(user => user.id !== userId);
    }

    //load the existed data to the form input 
    function loadUserDataForEditing(userId) {
        const user = userDB.find(user => user.id === userId);
        if (user) {
            Object.entries(user.data).forEach(([key, value]) => {
                const input = form.find(`[name="${key}"]`);
                if (input) {
                    if (input.prop("type") === "checkbox") {
                        input.prop("checked", value.includes(input.val()));
                    } else if (input.prop("type") === "radio") {
                        input.prop("checked", input.val() === value);
                    } else {
                        input.val(value);
                    }
                }
            });
            editingUserId = userId;
        }
    }

    // createTableRow function to create table rows and return the table data
    function createTableRow(DB) {
        let tabledata = "";
        $.each(DB, function (index) {
            let tableDiscriptions = "";
            $.each(DB[index], function (key, value) {
                if (key == "data") {
                    $.each(DB[index]["data"], function (key, value) {
                        let td = `<td>${value}</td>`;
                        tableDiscriptions += td;
                    });
                } else {
                    let td = `<td>${value}</td>`;
                    tableDiscriptions += td;
                }
            });
            let tableRow = `<tr data-user-id="${DB[index].id}">${tableDiscriptions}<td>
                <button class="${ACTIONS.EDIT}">Edit</button>
                <button class="${ACTIONS.DELETE}">Delete</button>
            </td></tr>`;

            tabledata += tableRow;
        });

        return tabledata;
    }

    // render data in the table
    function renderTable(DB) {
        tableBody.html("");
        tableBody.append(createTableRow(DB));
    }

    // function to filter the table by the name column
    function tableFilter() {
        const filter = searchInput.val().toUpperCase();
        tableBody.find("tr").each(function () {
            const nameColumn = $(this).find("td").eq(1).text(); // Assuming the name is in the second column
            if (nameColumn.toUpperCase().indexOf(filter) > -1) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }
});
