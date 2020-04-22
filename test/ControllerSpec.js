/*global app, jasmine, describe, it, beforeEach, expect */

describe('controller', function () {
  'use strict';

  var subject, model, view;

  var setUpModel = function (todos) {
    model.read.and.callFake(function (query, callback) {
      callback = callback || query;
      callback(todos);
    });

    model.getCount.and.callFake(function (callback) {

      var todoCounts = {
        active: todos.filter(function (todo) {
          return !todo.completed;
        }).length,
        completed: todos.filter(function (todo) {
          return !!todo.completed;
        }).length,
        total: todos.length
      };

      callback(todoCounts);
    });

    model.remove.and.callFake(function (id, callback) {
      callback();
    });

    model.create.and.callFake(function (title, callback) {
      callback();
    });

    model.update.and.callFake(function (id, updateData, callback) {
      callback();
    });
  };

  var createViewStub = function () {
    var eventRegistry = {};
    return {
      render: jasmine.createSpy('render'),
      bind: function (event, handler) {
        // Is used by the Controller, we save the events added to be executed with trigger
        eventRegistry[event] = handler;
      },
      trigger: function (event, parameter) {
        eventRegistry[event](parameter);
      }
    };
  };

  beforeEach(function () {
    model = jasmine.createSpyObj('model', ['read', 'getCount', 'remove', 'create', 'update']);
    view = createViewStub();
    subject = new app.Controller(model, view);
  });

  it('should show entries on start-up', function () {
      var todos = [{title: 'todo start-up 1'}, {title: 'todo start-up 2'}];

      setUpModel(todos);
      subject.setView('');

      // Added
      expect(view.render).toHaveBeenCalledWith('showEntries', todos);
  });

  describe('routing', function () {
    it('should show all entries without a route', function () {
      var todos = [{title: 'my todo'}];

      setUpModel(todos);
      subject.setView('');

      expect(view.render).toHaveBeenCalledWith('showEntries', todos);
    });

    it('should show all entries without "all" route', function () {
      var todos = [{title: 'my todo'}];

      setUpModel(todos);
      subject.setView('#/');

      expect(view.render).toHaveBeenCalledWith('showEntries', todos);
    });

    it('should show active entries', function () {
      var todos = [
        { id: 1, title: 'my todo completed', completed: true },
        { id: 2, title: 'my todo', completed: false },
        { id: 3, title: 'my todo 2', completed: false },
      ];

      setUpModel(todos);
      subject.setView('#/active');

      // Added
      expect(view.render).toHaveBeenCalledWith('setFilter', 'active');
      expect(model.read.calls.count()).toBe(1);
      expect(model.read).toHaveBeenCalledWith({ completed: false }, jasmine.any(Function));
      expect(view.render).toHaveBeenCalledWith('showEntries', todos);
    });

    it('should show completed entries', function () {
      var todos = [
        { id: 1, title: 'my todo', completed: false },
        { id: 2, title: 'my todo completed', completed: true },
        { id: 3, title: 'my todo completed 2', completed: true },
      ];

      setUpModel(todos);
      subject.setView('#/completed');

      // Added
      expect(view.render).toHaveBeenCalledWith('setFilter', 'completed');
      expect(model.read).toHaveBeenCalledWith({ completed: true }, jasmine.any(Function));
      expect(model.read.calls.count()).toBe(1);
      expect(view.render).toHaveBeenCalledWith('showEntries', todos);
    });
  });

  it('should show the content block when todos exists', function () {
    setUpModel([{title: 'my todo', completed: true}]);

    subject.setView('');

    expect(view.render).toHaveBeenCalledWith('contentBlockVisibility', {
      visible: true
    });
  });

  it('should hide the content block when no todos exists', function () {
    setUpModel([]);

    subject.setView('');

    expect(view.render).toHaveBeenCalledWith('contentBlockVisibility', {
      visible: false
    });
  });

  it('should check the toggle all button, if all todos are completed', function () {
    setUpModel([{title: 'my todo', completed: true}]);

    subject.setView('');

    expect(view.render).toHaveBeenCalledWith('toggleAll', {
      checked: true
    });
  });

  it('should set the "clear completed" button, with all complete', function () {
    var todos = [
      {id: 42, title: 'my todo', completed: true},
      {id: 43, title: 'my todo 2', completed: true}
    ];
    setUpModel(todos);

    subject.setView('');

    expect(view.render).toHaveBeenCalledWith('clearCompletedButton', {
      completed: 2,
      visible: true
    });
  });

  // Added
  it('should set the "clear completed" button, with once complete', function () {
    var todos = [
      {id: 42, title: 'my todo', completed: true},
      {id: 43, title: 'my todo 2', completed: false}
    ];
    setUpModel(todos);

    subject.setView('');

    expect(view.render).toHaveBeenCalledWith('clearCompletedButton', {
      completed: 1,
      visible: true
    });
  });

  // Added
  it('should not set the "clear completed" button, with all active', function () {
    var todos = [
      {id: 42, title: 'my todo', completed: false},
      {id: 43, title: 'my todo 2', completed: false}
    ];
    setUpModel(todos);

    subject.setView('');

    expect(view.render).toHaveBeenCalledWith('clearCompletedButton', {
      completed: 0,
      visible: false
    });
  });

  it('should highlight "All" filter by default', function () {
    var todos = [
      {id: 1, title: 'my todo', completed: false},
      {id: 1, title: 'my todo', completed: true}
    ];

    setUpModel(todos);
    subject.setView('');

    // Added ('' is equal to All => controller.js#277)
    expect(view.render).toHaveBeenCalledWith('setFilter', '');
  });

  it('should highlight "Active" filter when switching to active view', function () {
    var todos = [
      { id: 1, title: 'my todo completed', completed: true },
      { id: 2, title: 'my todo', completed: false },
      { id: 3, title: 'my todo 2', completed: false },
    ];

    setUpModel(todos);
    subject.setView('#/active');

    // Added
    expect(view.render).toHaveBeenCalledWith('setFilter', 'active');
  });

  describe('toggle all', function () {
    it('should toggle all todos to completed', function () {
      var todos = [
        { id: 1, title: 'my todo completed', completed: true },
        { id: 2, title: 'my todo', completed: false },
        { id: 3, title: 'my todo 2', completed: false },
      ];
      var anyFn = jasmine.any(Function);
      setUpModel(todos);
      model.read.and.callFake(function (query, callback) {
        callback = callback || query;
        callback(todos.filter(t => t.completed === query.completed));
      });

      subject.setView('');

      // Added (View createViewStub and controller#44)
      view.trigger('toggleAll', { completed: true });

      expect(model.read).toHaveBeenCalledWith({ completed: false }, anyFn);
      expect(model.update).toHaveBeenCalledWith(2, { completed: true }, anyFn);
      expect(model.update).toHaveBeenCalledWith(3, { completed: true }, anyFn);
      expect(model.update.calls.count()).toBe(2);
    });

    // Added
    it('should toggle all todos to active', function () {
      var todos = [
        { id: 1, title: 'my todo', completed: false },
        { id: 2, title: 'my todo completed', completed: true },
        { id: 3, title: 'my todo 2 completed', completed: true },
      ];
      var anyFn = jasmine.any(Function);
      setUpModel(todos);
      model.read.and.callFake(function (query, callback) {
        callback = callback || query;
        callback(todos.filter(t => t.completed === query.completed));
      });

      subject.setView('');

      // Added (View createViewStub and controller#44)
      view.trigger('toggleAll', { completed: false });

      expect(model.read).toHaveBeenCalledWith({ completed: true }, anyFn);
      expect(model.update).toHaveBeenCalledWith(2, { completed: false }, anyFn);
      expect(model.update).toHaveBeenCalledWith(3, { completed: false }, anyFn);
      expect(model.update.calls.count()).toBe(2);
    });

    it('should update the view', function () {
      var todos = [
        { id: 1, title: 'my todo completed', completed: false },
        { id: 2, title: 'my todo', completed: false },
        { id: 3, title: 'my todo 2', completed: false },
      ];

      model.read.and.callFake(function (query, callback) {
        callback = callback || query;
        callback(todos);
      });
      model.update.and.callFake(function (id, updateData, callback) {
        todos.find(td => td.id === id).completed = updateData.completed;
      });
      model.getCount.and.callFake(function (callback) {
        var todoCounts = {
          active: todos.filter(function (todo) {
            return !todo.completed;
          }).length,
          completed: todos.filter(function (todo) {
            return !!todo.completed;
          }).length,
          total: todos.length
        };
        callback(todoCounts);
      });

      // Added
      subject.setView('');
      // I reset the calls of render to validate that toggleAll trigger dispatch again
      // the toggleAll render
      expect(view.render).toHaveBeenCalledWith('toggleAll', { checked: false });
      view.render.calls.reset();
      view.trigger('toggleAll', { completed: true });
      expect(view.render).toHaveBeenCalledWith('toggleAll', { checked: true });
    });
  });

  describe('new todo', function () {
    it('should add a new todo to the model', function () {
      setUpModel([]);

      subject.setView('');
      view.trigger('newTodo', 'a new todo');
      // Added
      expect(model.create).toHaveBeenCalledWith('a new todo', jasmine.any(Function));
    });

    it('should add a new todo to the view', function () {
      setUpModel([]);

      subject.setView('');

      view.render.calls.reset();
      model.read.calls.reset();
      model.read.and.callFake(function (callback) {
        callback([{
          title: 'a new todo',
          completed: false
        }]);
      });

      view.trigger('newTodo', 'a new todo');

      expect(model.read).toHaveBeenCalled();

      expect(view.render).toHaveBeenCalledWith('showEntries', [{
        title: 'a new todo',
        completed: false
      }]);
    });

    it('should clear the input field when a new todo is added', function () {
      setUpModel([]);

      subject.setView('');

      view.trigger('newTodo', 'a new todo');

      expect(view.render).toHaveBeenCalledWith('clearNewTodo');
    });
  });

  describe('element removal', function () {
    it('should remove an entry from the model', function () {
      var todos = [{id: 42, title: 'my todo', completed: true}];
      setUpModel(todos);

      subject.setView('');
      view.trigger('itemRemove', {id: 42});

      // Added
      expect(model.remove).toHaveBeenCalledWith(42, jasmine.any(Function));
    });

    it('should remove an entry from the view', function () {
      var todos = [{id: 42, title: 'my todo', completed: true}];
      setUpModel(todos);

      subject.setView('');
      view.trigger('itemRemove', {id: 42});

      expect(view.render).toHaveBeenCalledWith('removeItem', 42);
    });

    it('should update the element count', function () {
      var todos = [{id: 42, title: 'my todo', completed: true}];
      setUpModel(todos);

      subject.setView('');
      view.trigger('itemRemove', {id: 42});

      expect(view.render).toHaveBeenCalledWith('updateElementCount', 0);
    });
  });

  describe('remove completed', function () {
    it('should remove a completed entry from the model', function () {
      var todos = [{id: 42, title: 'my todo', completed: true}];
      setUpModel(todos);

      subject.setView('');
      view.trigger('removeCompleted');

      expect(model.read).toHaveBeenCalledWith({completed: true}, jasmine.any(Function));
      expect(model.remove).toHaveBeenCalledWith(42, jasmine.any(Function));
    });

    it('should remove a completed entry from the view', function () {
      var todos = [{id: 42, title: 'my todo', completed: true}];
      setUpModel(todos);

      subject.setView('');
      view.trigger('removeCompleted');

      expect(view.render).toHaveBeenCalledWith('removeItem', 42);
    });
  });

  describe('element complete toggle', function () {
    it('should update the model', function () {
      var todos = [{id: 21, title: 'my todo', completed: false}];
      setUpModel(todos);
      subject.setView('');

      view.trigger('itemToggle', {id: 21, completed: true});

      expect(model.update).toHaveBeenCalledWith(21, {completed: true}, jasmine.any(Function));
    });

    it('should update the view', function () {
      var todos = [{id: 42, title: 'my todo', completed: true}];
      setUpModel(todos);
      subject.setView('');

      view.trigger('itemToggle', {id: 42, completed: false});

      expect(view.render).toHaveBeenCalledWith('elementComplete', {id: 42, completed: false});
    });
  });

  describe('edit item', function () {
    it('should switch to edit mode', function () {
      var todos = [{id: 21, title: 'my todo', completed: false}];
      setUpModel(todos);

      subject.setView('');

      view.trigger('itemEdit', {id: 21});

      expect(view.render).toHaveBeenCalledWith('editItem', {id: 21, title: 'my todo'});
    });

    it('should leave edit mode on done', function () {
      var todos = [{id: 21, title: 'my todo', completed: false}];
      setUpModel(todos);

      subject.setView('');

      view.trigger('itemEditDone', {id: 21, title: 'new title'});

      expect(view.render).toHaveBeenCalledWith('editItemDone', {id: 21, title: 'new title'});
    });

    it('should persist the changes on done', function () {
      var todos = [{id: 21, title: 'my todo', completed: false}];
      setUpModel(todos);

      subject.setView('');

      view.trigger('itemEditDone', {id: 21, title: 'new title'});

      expect(model.update).toHaveBeenCalledWith(21, {title: 'new title'}, jasmine.any(Function));
    });

    it('should remove the element from the model when persisting an empty title', function () {
      var todos = [{id: 21, title: 'my todo', completed: false}];
      setUpModel(todos);

      subject.setView('');

      view.trigger('itemEditDone', {id: 21, title: ''});

      expect(model.remove).toHaveBeenCalledWith(21, jasmine.any(Function));
    });

    it('should remove the element from the view when persisting an empty title', function () {
      var todos = [{id: 21, title: 'my todo', completed: false}];
      setUpModel(todos);

      subject.setView('');

      view.trigger('itemEditDone', {id: 21, title: ''});

      expect(view.render).toHaveBeenCalledWith('removeItem', 21);
    });

    it('should leave edit mode on cancel', function () {
      var todos = [{id: 21, title: 'my todo', completed: false}];
      setUpModel(todos);

      subject.setView('');

      view.trigger('itemEditCancel', {id: 21});

      expect(view.render).toHaveBeenCalledWith('editItemDone', {id: 21, title: 'my todo'});
    });

    it('should not persist the changes on cancel', function () {
      var todos = [{id: 21, title: 'my todo', completed: false}];
      setUpModel(todos);

      subject.setView('');

      view.trigger('itemEditCancel', {id: 21});

      expect(model.update).not.toHaveBeenCalled();
    });
  });
});
