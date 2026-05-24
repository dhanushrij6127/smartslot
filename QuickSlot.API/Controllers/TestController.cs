using Microsoft.AspNetCore.Mvc;

namespace QuickSlot.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet("hello")]
        public IActionResult Hello()
        {
            return Ok("QuickSlot API is working 🚀");
        }
    }
}