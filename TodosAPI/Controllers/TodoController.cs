using TodosAPI.Models;
using TodosAPI.Services;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace TodosApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TodoController : ControllerBase
    {
        private readonly TodoService _todoService;

        public TodoController(TodoService todoService)
        {
            _todoService = todoService;
        }

        [HttpGet]
        public ActionResult<List<Todo>> Get() =>
            _todoService.Get();

        [HttpGet("{id:length(24)}", Name = "GetTodo")]
        public ActionResult<Todo> Get(string id)
        {
            var todo = _todoService.Get(id);

            if (todo == null)
            {
                return NotFound();
            }

            return todo;
        }

        [HttpPost]
        public ActionResult<Todo> Create(Todo todo)
        {
            _todoService.Create(todo);

            return CreatedAtRoute("GetTodo", new { id = todo.Id.ToString() }, todo);
        }

        [HttpPut]
        public IActionResult Update(Todo todoIn)
        {
            var todo = _todoService.Get(todoIn.Id);

            if (todo == null)
            {
                return NotFound();
            }

            _todoService.Update(todoIn);

            return NoContent();
        }

        [HttpDelete("{id:length(24)}")]
        public IActionResult Delete(string id)
        {
            var todo = _todoService.Get(id);

            if (todo == null)
            {
                return NotFound();
            }

            _todoService.Remove(todo.Id);

            return NoContent();
        }
    }
}