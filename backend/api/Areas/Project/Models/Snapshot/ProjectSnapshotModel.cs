using System;

namespace Pims.Api.Areas.Project.Models.Snapshot
{
    /// <summary>
    /// ProjectSnapshotModel class, provides a model to represent the project.
    /// </summary>
    public class ProjectSnapshotModel : Api.Models.BaseModel
    {
        #region Properties
        /// <summary>
        /// get/set - The primary key to identify the project.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// get/set - The project id corresponding to this snapshot.
        /// </summary>
        public int ProjectId { get; set; }

        /// <summary>
        /// get/set - The snapshot to compare to this snapshot.
        /// </summary>
        public int? FromSnapshotId { get; set; }

        /// <summary>
        /// get/set - The snapshot to compare to this snapshot.
        /// </summary>
        public ProjectSnapshotModel FromSnapshot { get; set; }

        /// <summary>
        /// get/set - The name to identify the project snapshot.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// get/set - Whether or not this snapshot is final and should not be deleted/edited.
        /// </summary>
        public bool IsFinal { get; set; }

        /// <summary>
        /// get/set - The date when this snapshot's data was taken from the project.
        /// </summary>
        public DateTime? SnapshotOn { get; set; }

        /// <summary>
        /// get/set - The netbook value which is the sum of the properties.
        /// </summary>
        public decimal NetBook { get; set; }

        /// <summary>
        /// get/set - The estimated value which is the sum of the properties.
        /// </summary>
        public decimal Estimated { get; set; }

        /// <summary>
        /// get/set - The assessed value which is the sum of the properties.
        /// </summary>
        public decimal Assessed { get; set; }

        /// <summary>
        /// get/set - The sales cost.
        /// </summary>
        public decimal? SalesCost { get; set; }

        /// <summary>
        /// get/set - The net proceeds
        /// </summary>
        public decimal? NetProceeds { get; set; }

        /// <summary>
        /// get/set - The program cost.
        /// </summary>
        public decimal? ProgramCost { get; set; }

        /// <summary>
        /// get/set - The gain or loss from selling the properties.
        /// </summary>
        public decimal? GainLoss { get; set; }

        /// <summary>
        /// get/set - OCG final statement.
        /// </summary>
        public decimal? OcgFinancialStatement { get; set; }

        /// <summary>
        /// get/set - Record the interest component.
        /// </summary>
        public decimal? InterestComponent { get; set; }

        /// <summary>
        /// get/set - Whether the sale includes a lease in place (SLIP).
        /// </summary>
        public bool SaleWithLeaseInPlace { get; set; }
        #endregion
    }
}
