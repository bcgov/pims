using MapsterMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pims.Api.Areas.Notification.Models.Template;
using Pims.Api.Models;
using Pims.Api.Policies;
using Pims.Dal;
using Entity = Pims.Dal.Entities;
using Pims.Dal.Security;
using Swashbuckle.AspNetCore.Annotations;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Pims.Api.Areas.Notification.Controllers
{
    /// <summary>
    /// TemplateController class, provides endpoints for interacting with notification templates.
    /// </summary>
    [Authorize]
    [ApiController]
    [ApiVersion("1.0")]
    [Area("notifications")]
    [Route("v{version:apiVersion}/[area]/templates")]
    [Route("[area]/templates")]
    public class TemplateController : ControllerBase
    {
        #region Variables
        private readonly IPimsService _pimsService;
        private readonly IMapper _mapper;
        #endregion

        #region Constructors
        /// <summary>
        /// Creates a new instance of a TemplateController class, initializes it with the specified arguments.
        /// </summary>
        /// <param name="pimsService"></param>
        /// <param name="mapper"></param>
        public TemplateController(IPimsService pimsService, IMapper mapper)
        {
            _pimsService = pimsService;
            _mapper = mapper;
        }
        #endregion

        #region Endpoints
        /// <summary>
        /// Get all the notification templates.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [HasPermission(Permissions.SystemAdmin)]
        [Produces("application/json")]
        [ProducesResponseType(typeof(IEnumerable<NotificationTemplateModel>), 200)]
        [SwaggerOperation(Tags = new[] { "notification" })]
        public IActionResult GetNotificationTemplates()
        {
            var templates = _pimsService.NotificationTemplate.Get();
            return new JsonResult(_mapper.Map<NotificationTemplateModel[]>(templates));
        }

        /// <summary>
        /// Get the notification template for the specified 'id'.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet("{id}")]
        [HasPermission(Permissions.SystemAdmin)]
        [Produces("application/json")]
        [ProducesResponseType(typeof(NotificationTemplateModel), 200)]
        [ProducesResponseType(typeof(ErrorResponseModel), 400)]
        [SwaggerOperation(Tags = new[] { "notification" })]
        public IActionResult GetNotificationTemplate(int id)
        {
            var template = _pimsService.NotificationTemplate.Get(id);
            return new JsonResult(_mapper.Map<NotificationTemplateModel>(template));
        }

        /// <summary>
        /// Add the specificied notification 'template' to the datasource.
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [HasPermission(Permissions.SystemAdmin)]
        [Produces("application/json")]
        [ProducesResponseType(typeof(NotificationTemplateModel), 201)]
        [ProducesResponseType(typeof(ErrorResponseModel), 400)]
        [SwaggerOperation(Tags = new[] { "notification" })]
        public IActionResult AddNotificationTemplate([FromBody] NotificationTemplateModel model)
        {
            var template = _pimsService.NotificationTemplate.Add(_mapper.Map<Entity.NotificationTemplate>(model));
            return CreatedAtAction(nameof(GetNotificationTemplate), new { id = template.Id }, _mapper.Map<NotificationTemplateModel>(template));
        }

        /// <summary>
        /// Update the specificied notification 'template' in the datasource.
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPut("{id}")]
        [HasPermission(Permissions.SystemAdmin)]
        [Produces("application/json")]
        [ProducesResponseType(typeof(NotificationTemplateModel), 200)]
        [ProducesResponseType(typeof(ErrorResponseModel), 400)]
        [SwaggerOperation(Tags = new[] { "notification" })]
        public IActionResult UpdateNotificationTemplate([FromBody] NotificationTemplateModel model)
        {
            var template = _pimsService.NotificationTemplate.Update(_mapper.Map<Entity.NotificationTemplate>(model));
            return new JsonResult(_mapper.Map<NotificationTemplateModel>(template));
        }

        /// <summary>
        /// Delete the specificied notification 'template' from the datasource.
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpDelete("{id}")]
        [HasPermission(Permissions.SystemAdmin)]
        [Produces("application/json")]
        [ProducesResponseType(typeof(NotificationTemplateModel), 200)]
        [ProducesResponseType(typeof(ErrorResponseModel), 400)]
        [SwaggerOperation(Tags = new[] { "notification" })]
        public IActionResult DeleteNotificationTemplate([FromBody] NotificationTemplateModel model)
        {
            _pimsService.NotificationTemplate.Remove(_mapper.Map<Entity.NotificationTemplate>(model));
            return new JsonResult(model);
        }

        /// <summary>
        /// Send an email for the specified notification template 'templateId' to the specified list of email addresses in 'to'.
        /// </summary>
        /// <param name="templateId"></param>
        /// <param name="to"></param>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost("{templateId}")]
        [HasPermission(Permissions.SystemAdmin)]
        [Produces("application/json")]
        [ProducesResponseType(typeof(Models.Queue.NotificationQueueModel), 201)]
        [ProducesResponseType(typeof(ErrorResponseModel), 400)]
        [SwaggerOperation(Tags = new[] { "notification" })]
        public async Task<IActionResult> SendNotificationAsync(int templateId, string to, [FromBody] object model = null) // TODO: Provide a way to pass a model.
        {
            var notification = await _pimsService.NotificationTemplate.SendNotificationAsync(templateId, to, model);

            return CreatedAtAction(nameof(QueueController.GetNotificationQueue), new { controller = "queue", id = notification.Id }, _mapper.Map<Models.Queue.NotificationQueueModel>(notification));
        }
        #endregion
    }
}
