using System;
using System.Diagnostics.CodeAnalysis;
using Pims.Api.Models;

namespace Pims.Api.Areas.Keycloak.Models
{
    /// <summary>
    /// AgencyModel class, provides a model to represent the agency.
    /// </summary>
    public class AgencyModel : BaseModel, IEquatable<AgencyModel>
    {
        #region Properties
        /// <summary>
        /// get/set - An unique identify for the agency.
        /// </summary>
        /// <value></value>
        public int Id { get; set; }

        /// <summary>
        /// get/set - A unique name to identify the agency.
        /// </summary>
        /// <value></value>
        public string Name { get; set; }

        /// <summary>
        /// get/set - A unique code to identify the agency.
        /// </summary>
        /// <value></value>
        public string Code { get; set; }

        /// <summary>
        /// get/set - The agency description.
        /// </summary>
        /// <value></value>
        public string Description { get; set; }

        /// <summary>
        /// get/set - The id of the owning agency.
        /// </summary>
        /// <value></value>
        public int? ParentId { get; set; }
        #endregion

        #region Methods
        public override bool Equals(object obj)
        {
            return Equals(obj as AgencyModel);
        }

        public bool Equals([AllowNull] AgencyModel other)
        {
            return other != null &&
                   Id.Equals(other.Id) &&
                   Name == other.Name &&
                   Description == other.Description &&
                   Code == other.Code &&
                   ParentId == other.ParentId;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Id, Name, Description, Code, ParentId);
        }
        #endregion
    }
}
