/***********************************************************************
 * App Controllers. These controllers will be called on page initialization. *
 ***********************************************************************/

myApp.controllers = {

  //////////////////////////
  // Tabbar Page Controller //
  //////////////////////////
  tabbarPage: function(page) {
    // Set button functionality to open/close the menu.
    page.querySelector('[component="button/menu"]').onclick = function() {
      document.querySelector('#mySplitter').left.toggle();
    };

    // Set button functionality to push 'new_task.html' page.
    Array.prototype.forEach.call(page.querySelectorAll('[component="button/new-task"]'), function(element) {
      element.onclick = function() {
        document.querySelector('#myNavigator').pushPage('html/new_task.html').then(function(){
          let select = document.querySelector("#newTaskPage").querySelector("ons-select").querySelector("select");
          console.log(myApp.services.categories.returnAllCategories());
          myApp.services.categories.returnAllCategories().forEach(category => {
            select.innerHTML += "<option value='" + category + "'>" + category + "</option>";
          });
        });
      }

      element.show && element.show(); // Fix ons-fab in Safari.
    });

    // Change tabbar animation depending on platform.
    page.querySelector('#myTabbar').setAttribute('animation', ons.platform.isAndroid() ? 'slide' : 'none');
  },

  ////////////////////////
  // Menu Page Controller //
  ////////////////////////
  menuPage: function(page) {
    // Set functionality for 'No Category' and 'All' default categories respectively.
    myApp.services.categories.bindOnCheckboxChange(page.querySelector('#default-category-list ons-list-item[category-id=""]'));
    myApp.services.categories.bindOnCheckboxChange(page.querySelector('#default-category-list ons-list-item:not([category-id])'));

    // Change splitter animation depending on platform.
    document.querySelector('#mySplitter').left.setAttribute('animation', ons.platform.isAndroid() ? 'overlay' : 'reveal');
  },

  ////////////////////////////
  // New Task Page Controller //
  ////////////////////////////
  newTaskPage: function(page) {
    // Set button functionality to save a new task.

    Array.prototype.forEach.call(page.querySelectorAll('[component="button/save-task"]'), function(element) {
      element.onclick = function() {
        var newTitle = page.querySelector('#title-input').value;

        if (newTitle) {
          // If input title is not empty, create a new task.

          var task = {
            title: newTitle,
            description: page.querySelector('#description-input').value,
            highlight: page.querySelector('#highlight-input').checked,
            urgent: page.querySelector('#urgent-input').checked,
            state: 1
          }

          let select = page.querySelector("#choose-sel");

          // Aller chercher le select dans la page et faire la verif dessus : P4
          if (select.value !== "-") {
            task.category = select.value;
          } else if(page.querySelector('#category-input').value !== undefined){
            task.category = page.querySelector('#category-input').value;
          } else{
            task.category = "";
          }

          if (myApp.services.tasks.store(task)) {
            myApp.services.tasks.create(task);
            // Set selected category to 'All', refresh and pop page.
            document.querySelector('#default-category-list ons-list-item ons-radio').checked = true;
            document.querySelector('#default-category-list ons-list-item').updateCategoryView();
            document.querySelector('#myNavigator').popPage();
          } else {
            //Show alert if title is already used
            ons.notification.alert('You must provide another title.');
          }



        } else {
          // Show alert if the input title is empty.
          ons.notification.alert('You must provide a task title.');
        }
      };
    });
  },

  ////////////////////////////////
  // Details Task Page Controller //
  ///////////////////////////////
  detailsTaskPage: function(page) {
    // Get the element passed as argument to pushPage.
    var element = page.data.element;

    let select = page.querySelector("ons-select").querySelector("select");
    myApp.services.categories.returnAllCategories().forEach(category => {
      select.innerHTML += "<option value='" + category + "'>" + category + "</option>";
    });

    // Fill the view with the stored data.
    page.querySelector('#title-input').value = element.data.title;
    page.querySelector('#category-input').value = element.data.category;
    page.querySelector('#description-input').value = element.data.description;
    page.querySelector('#highlight-input').checked = element.data.highlight;
    page.querySelector('#urgent-input').checked = element.data.urgent;

    // Set button functionality to save an existing task.
    page.querySelector('[component="button/save-task"]').onclick = function() {

      var newTitle = page.querySelector('#title-input').value;

      if (newTitle) {
        // If input title is not empty, ask for confirmation before saving.
        ons.notification.confirm(
          {
            title: 'Save changes?',
            message: 'Previous data will be overwritten.',
            buttonLabels: ['Discard', 'Save']
          }
        ).then(function(buttonIndex) {
          if (buttonIndex === 1) {

            let task = {
              title: newTitle,
              //category: page.querySelector('#category-input').value,
              description: page.querySelector('#description-input').value,
              urgent: element.data.urgent,
              state: element.data.state,
              highlight: page.querySelector('#highlight-input').checked
            }

            let selector = page.querySelector("#choose-sel");

            // Aller chercher le select dans la page et faire la verif dessus : P4
            if (selector.value !== "-") {
              task.category = selector.value;
            } else if(page.querySelector('#category-input').value !== undefined){
              task.category = page.querySelector('#category-input').value;
            } else{
              task.category = "";
            }

            if(myApp.services.tasks.exists(task)) ons.notification.alert('You must provide another title.');
            else{
              // If 'Save' button was pressed, overwrite the task.
              myApp.services.tasks.update(element, task);

              // Set selected category to 'All', refresh and pop page.
              document.querySelector('#default-category-list ons-list-item ons-radio').checked = true;
              document.querySelector('#default-category-list ons-list-item').updateCategoryView();
              document.querySelector('#myNavigator').popPage();
            }
          }
        });

      } else {
        // Show alert if the input title is empty.
        ons.notification.alert('You must provide a task title.');
      }
    };
  },

  listenersAdd: function () {
    document.querySelector("#purgeTasks")
        .addEventListener("click", myApp.services.tasks.purge);
  },

  onSelectChange: function(event) {
    event.target.parentNode.parentNode.querySelector("ons-input").disabled = event.target.value !== "-"
    //console.log()
  },

  changeSorting: function(event) {
    myApp.services.ascendingSort = !myApp.services.ascendingSort;
    myApp.controllers.displaySort();
  },
  displaySort: function() {

    document.querySelector("#pending-list").innerHTML = "";
    document.querySelector("#in-progress-list").innerHTML = "";
    document.querySelector("#completed-list").innerHTML = "";

    let tabTask = [];

    for(let key in window.localStorage){
      if(!key.startsWith('item:')) continue;

      tabTask.push(JSON.parse(window.localStorage.getItem(key)));
    }

    if(myApp.services.ascendingSort){
      tabTask.sort(function(a, b){
        if(a.title < b.title) { return -1; }
        if(a.title > b.title) { return 1; }
        return 0;
      })
    }else{
      tabTask.sort(function(a, b){
        if(a.title < b.title) { return 1; }
        if(a.title > b.title) { return -1; }
        return 0;
      })
    }


    tabTask.forEach(element => {
      myApp.services.tasks.create(element);
    });
  }

};
