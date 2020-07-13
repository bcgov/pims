using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using Pims.Core.Comparers;
using Pims.Core.Extensions;
using Pims.Core.Test;
using Pims.Dal.Entities;
using Pims.Dal.Entities.Models;
using Pims.Dal.Exceptions;
using Pims.Dal.Helpers.Extensions;
using Pims.Dal.Security;
using Pims.Dal.Services;
using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Xunit;
using Entity = Pims.Dal.Entities;

namespace Pims.Dal.Test.Services
{
    [Trait("category", "unit")]
    [Trait("category", "dal")]
    [Trait("group", "project")]
    [ExcludeFromCodeCoverage]
    public class ProjectServiceTest
    {
        #region Data
        public static IEnumerable<object[]> ProjectFilters =>
            new List<object[]>
            {
                new object[] { new ProjectFilter() { ProjectNumber = "ProjectNumber" }, 1 },
                new object[] { new ProjectFilter() { Name = "Name" }, 1 },
                new object[] { new ProjectFilter() { Agencies = new int[] { 3 } }, 1 },
                new object[] { new ProjectFilter() { TierLevelId = 2 }, 1 },
                new object[] { new ProjectFilter() { StatusId = new int[] { 2 } }, 1 }
            };

        public static IEnumerable<object[]> Workflows =>
            new List<object[]>
            {
                new object[] { "SubmitDisposal", 6 },
                new object[] { "ReviewDisposal", 1 }
            };
        #endregion

        #region Constructors
        public ProjectServiceTest() { }
        #endregion

        #region Tests
        #region GetPage
        /// <summary>
        /// User does not have 'property-view' claim.
        /// </summary>
        [Fact]
        public void GetPage_ArgumentNullException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView);
            var service = helper.CreateService<ProjectService>(user);

            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() =>
                service.GetPage(null));
        }

        /// <summary>
        /// User does not have 'property-view' claim.
        /// </summary>
        [Fact]
        public void GetPage_NotAuthorized()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission();
            var filter = new ProjectFilter();

            var service = helper.CreateService<ProjectService>(user);

            // Act
            // Assert
            Assert.Throws<NotAuthorizedException>(() =>
                service.GetPage(filter));
        }

        [Theory]
        [MemberData(nameof(ProjectFilters))]
        public void GetPage(ProjectFilter filter, int expectedCount)
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView).AddAgency(1, 3);

            using var init = helper.InitializeDatabase(user);
            var projects = init.CreateProjects(1, 20);
            projects.Next(0).Name = "-Name-";
            projects.Next(1).Agency = init.Agencies.Find(3);
            projects.Next(1).AgencyId = 3;
            projects.Next(2).TierLevel = init.TierLevels.Find(2);
            projects.Next(2).TierLevelId = 2;
            projects.Next(3).Description = "-Description-";
            projects.Next(4).Status = init.ProjectStatus.Find(2);
            projects.Next(4).StatusId = 2;
            projects.Next(5).ProjectNumber = "-ProjectNumber-";
            init.SaveChanges();

            var options = Options.Create(new PimsOptions() { Project = new ProjectOptions() { DraftFormat = "TEST-{0:00000}" } });
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var result = service.GetPage(filter);

            // Assert
            Assert.NotNull(result);
            Assert.IsAssignableFrom<IEnumerable<Entity.Project>>(result);
            Assert.Equal(expectedCount, result.Total);
        }

        [Theory]
        [MemberData(nameof(ProjectFilters))]
        public void GetPage_AsAdmin(ProjectFilter filter, int expectedCount)
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.AdminProjects);

            using var init = helper.InitializeDatabase(user);
            var projects = init.CreateProjects(1, 20);
            projects.Next(0).Name = "-Name-";
            projects.Next(1).Agency = init.Agencies.Find(3);
            projects.Next(1).AgencyId = 3;
            projects.Next(2).TierLevel = init.TierLevels.Find(2);
            projects.Next(2).TierLevelId = 2;
            projects.Next(3).Description = "-Description-";
            projects.Next(4).Status = init.ProjectStatus.Find(2);
            projects.Next(4).StatusId = 2;
            projects.Next(5).ProjectNumber = "-ProjectNumber-";
            init.SaveChanges();

            var options = Options.Create(new PimsOptions() { Project = new ProjectOptions() { DraftFormat = "TEST-{0:00000}" } });
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var result = service.GetPage(filter);

            // Assert
            Assert.NotNull(result);
            Assert.IsAssignableFrom<IEnumerable<Entity.Project>>(result);
            Assert.Equal(expectedCount, result.Total);
        }
        #endregion

        #region Get Project
        /// <summary>
        /// User does not have 'property-view' claim.
        /// </summary>
        [Fact]
        public void Get_NotAuthorized()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission();
            var project = EntityHelper.CreateProject(1);
            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var service = helper.CreateService<ProjectService>(user);

            // Act
            // Assert
            Assert.Throws<NotAuthorizedException>(() =>
                service.Get($"SPP-{1:00000}"));
        }

        /// <summary>
        /// Project does not exist.
        /// </summary>
        [Fact]
        public void Get_KeyNotFound()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView);
            var project = EntityHelper.CreateProject(1);
            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var service = helper.CreateService<ProjectService>(user);

            // Act
            // Assert
            Assert.Throws<KeyNotFoundException>(() =>
                service.Get($"SPP-{2:00000}"));
        }

        /// <summary>
        /// User is attempting to view sensitive project from another agency.
        /// </summary>
        [Fact]
        public void Get_WrongAgency_KeyNotFound()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.SensitiveView);
            var project = EntityHelper.CreateProject(1);
            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var service = helper.CreateService<ProjectService>(user);

            // Act
            // Assert
            Assert.Throws<KeyNotFoundException>(() =>
                service.Get($"SPP-{1:00000}"));
        }

        /// <summary>
        /// Project found.
        /// </summary>
        [Fact]
        public void Get()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView).AddAgency(1);
            var project = EntityHelper.CreateProject(1);
            project.SubmittedOn = DateTime.UtcNow;
            project.ApprovedOn = DateTime.UtcNow;
            project.DeniedOn = DateTime.UtcNow;
            project.CancelledOn = DateTime.UtcNow;
            project.InitialNotificationSentOn = DateTime.UtcNow;
            project.ThirtyDayNotificationSentOn = DateTime.UtcNow;
            project.SixtyDayNotificationSentOn = DateTime.UtcNow;
            project.NinetyDayNotificationSentOn = DateTime.UtcNow;
            project.OnHoldNotificationSentOn = DateTime.UtcNow;
            project.ClearanceNotificationSentOn = DateTime.UtcNow;
            project.TransferredWithinGreOn = DateTime.UtcNow;
            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var service = helper.CreateService<ProjectService>(user);
            var context = helper.GetService<PimsContext>();

            // Act
            var result = service.Get($"SPP-{1:00000}");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(EntityState.Detached, context.Entry(result).State);
            Assert.Equal(project, result, new ShallowPropertyCompare());
            Assert.NotNull(project.ProjectNumber);
            Assert.NotNull(project.PrivateNote);
            Assert.NotNull(project.PublicNote);
            Assert.NotNull(project.SubmittedOn);
            Assert.NotNull(project.ApprovedOn);
            Assert.NotNull(project.DeniedOn);
            Assert.NotNull(project.CancelledOn);
            Assert.NotNull(project.InitialNotificationSentOn);
            Assert.NotNull(project.ThirtyDayNotificationSentOn);
            Assert.NotNull(project.SixtyDayNotificationSentOn);
            Assert.NotNull(project.NinetyDayNotificationSentOn);
            Assert.NotNull(project.OnHoldNotificationSentOn);
            Assert.NotNull(project.ClearanceNotificationSentOn);
            Assert.NotNull(project.TransferredWithinGreOn);
            Assert.NotNull(project.Name);
            Assert.NotNull(project.Agency);
            Assert.NotNull(project.Status);
            Assert.NotNull(project.TierLevel);
        }

        /// <summary>
        /// Project found.
        /// </summary>
        [Fact]
        public void Get_AsAdmin()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.AdminProjects);
            var project = EntityHelper.CreateProject(1);
            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var service = helper.CreateService<ProjectService>(user);
            var context = helper.GetService<PimsContext>();

            // Act
            var result = service.Get($"SPP-{1:00000}");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(EntityState.Detached, context.Entry(result).State);
            Assert.Equal(project, result, new ShallowPropertyCompare());
        }

        /// <summary>
        /// Project found, but user does not have 'sensitive-view' claim.
        /// Remove sensitive buildings.
        /// </summary>
        [Fact]
        public void Get_RemoveSensitiveBuildings()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView).AddAgency(1);

            using var init = helper.InitializeDatabase(user);
            var project = init.CreateProject(1);
            var parcel = init.CreateParcel(1);
            var building = init.CreateBuilding(parcel, 2);
            var sensitive = init.CreateBuilding(parcel, 3);
            sensitive.IsSensitive = true;
            project.AddProperty(parcel);
            project.AddProperty(building, sensitive);
            init.SaveChanges();

            var service = helper.CreateService<ProjectService>(user);
            var context = helper.GetService<PimsContext>();

            // Act
            var result = service.Get($"SPP-{1:00000}");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(EntityState.Detached, context.Entry(result).State);
            Assert.Equal(project, result, new ShallowPropertyCompare());
            Assert.Equal(2, result.Properties.Count());
            Assert.DoesNotContain(result.Properties, p => p.Building?.IsSensitive ?? false);
        }

        /// <summary>
        /// Sensitive project found.
        /// </summary>
        [Fact]
        public void Get_Sensitive()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.SensitiveView).AddAgency(1);

            using var init = helper.InitializeDatabase(user);
            var project = init.CreateProject(1);
            var parcel = init.CreateParcel(1);
            var building = init.CreateBuilding(parcel, 2);
            var sensitive = init.CreateBuilding(parcel, 3);
            sensitive.IsSensitive = true;
            project.AddProperty(parcel);
            project.AddProperty(building, sensitive);
            init.SaveChanges();

            var service = helper.CreateService<ProjectService>(user);
            var context = helper.GetService<PimsContext>();

            // Act
            var result = service.Get($"SPP-{1:00000}");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(EntityState.Detached, context.Entry(result).State);
            Assert.Equal(project, result, new ShallowPropertyCompare());
            Assert.Equal(3, result.Properties.Count());
            Assert.Contains(result.Properties, p => p.Building?.IsSensitive ?? false);
        }

        /// <summary>
        /// Sensitive project found.
        /// </summary>
        [Fact]
        public void Get_Sensitive_AsAdmin()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.AdminProjects, Permissions.ProjectView, Permissions.SensitiveView);

            using var init = helper.InitializeDatabase(user);
            var project = init.CreateProject(1);
            var parcel = init.CreateParcel(1);
            var building = init.CreateBuilding(parcel, 2);
            var sensitive = init.CreateBuilding(parcel, 3);
            sensitive.IsSensitive = true;
            init.SaveChanges();
            project.AddProperty(parcel);
            project.AddProperty(building, sensitive);
            init.SaveChanges();

            var service = helper.CreateService<ProjectService>(user);
            var context = helper.GetService<PimsContext>();

            // Act
            var result = service.Get($"SPP-{1:00000}");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(EntityState.Detached, context.Entry(result).State);
            Assert.Equal(project, result, new ShallowPropertyCompare());
            Assert.Equal(3, result.Properties.Count());
            Assert.Contains(result.Properties, p => p.Building?.IsSensitive ?? false);
        }
        #endregion

        #region Add
        /// <summary>
        /// User with appropriate permission successfully adds new project. Project Number is auto-generated.
        /// </summary>
        [Fact]
        public void Add_Project()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectAdd).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var agency = init.Agencies.Find(1);
            var tier = init.TierLevels.Find(1);
            var status = init.Workflows.Find(1).Status.First();
            var project = EntityHelper.CreateProject(1, agency, tier, status);
            project.ProjectNumber = "test-generation-override";

            var options = Options.Create(new PimsOptions() { Project = new ProjectOptions() { DraftFormat = "TEST-{0:00000}" } });
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var result = service.Add(project);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.ProjectNumber);
            Assert.Matches($"TEST-{1:00000}", result.ProjectNumber);
        }

        [Fact]
        public void Add_Financials()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectAdd).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1);
            project.ReportedFiscalYear = 2020;
            var parcel = init.CreateParcel(1, project.Agency);
            var buildings = init.CreateBuildings(parcel, 2, 5);
            init.CreateEvaluations(parcel, new DateTime(2015, 1, 1), 6, Entity.EvaluationKeys.Assessed, 5);
            init.CreateFiscals(parcel, 2015, 6, Entity.FiscalKeys.Estimated, 5);
            init.CreateFiscals(parcel, 2015, 6, Entity.FiscalKeys.NetBook, 5);
            init.CreateEvaluations(buildings.Next(0), new DateTime(2015, 1, 1), 6, Entity.EvaluationKeys.Assessed, 5);
            init.CreateFiscals(buildings.Next(0), 2015, 6, Entity.FiscalKeys.Estimated, 5);
            init.CreateFiscals(buildings.Next(0), 2015, 6, Entity.FiscalKeys.NetBook, 5);
            project.AddProperty(parcel);
            buildings.ForEach(b => project.AddProperty(b));

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var result = service.Add(project);

            // Assert
            Assert.NotNull(result);
            Assert.IsAssignableFrom<Entity.Project>(result);
            project.Estimated.Should().Be(10);
            project.NetBook.Should().Be(10);
            project.Assessed.Should().Be(10);
        }

        [Fact]
        public void Add_Project_SimpleFields()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectAdd, Permissions.ProjectView).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var agency = init.Agencies.Find(1);
            var tier = init.TierLevels.Find(1);
            var status = init.Workflows.Find(1).Status.First();
            var risk = init.ProjectRisks.Find(1);
            var project = EntityHelper.CreateProject(1, agency, tier, status, risk);
            project.ProjectNumber = "test-generation-override";
            project.PrivateNote = "private note";
            project.PublicNote = "public note";
            project.ExemptionRequested = true;
            project.ExemptionRationale = "Providing reasoning for exemption request";
            project.SubmittedOn = DateTime.Now;
            project.DeniedOn = DateTime.Now.AddDays(1);
            project.ApprovedOn = DateTime.Now.AddDays(2);

            var options = Options.Create(new PimsOptions() { Project = new ProjectOptions() { DraftFormat = "TEST-{0:00000}" } });
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            service.Add(project);
            var result = service.Get(project.Id);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.ProjectNumber);
            Assert.Matches($"TEST-{1:00000}", result.ProjectNumber);
            Assert.Matches("private note", result.PrivateNote);
            Assert.Matches("public note", result.PublicNote);
            Assert.True(result.ExemptionRequested);
            Assert.Matches("Providing reasoning for exemption request", result.ExemptionRationale);
            Assert.Equal(project.SubmittedOn, result.SubmittedOn);
            Assert.Equal(project.DeniedOn, result.DeniedOn);
            Assert.Equal(project.ApprovedOn, result.ApprovedOn);
        }

        [Fact]
        public void Add_DraftStatus()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectAdd).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var agency = init.Agencies.Find(1);
            var tier = init.TierLevels.Find(1);
            var status = init.Workflows.Find(1).Status.First();
            var risk = init.ProjectRisks.Find(1);
            var project = EntityHelper.CreateProject(1, agency, tier, status, risk);

            var options = Options.Create(new PimsOptions() { Project = new ProjectOptions() { NumberFormat = "TEST-{0:00000}" } });
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var result = service.Add(project);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(project, result);
            Assert.Equal(1, result.StatusId);
        }

        [Fact]
        public void Add_AddTasks()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectAdd).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var agency = init.Agencies.Find(1);
            var tier = init.TierLevels.Find(1);
            var status = init.Workflows.Find(1).Status.First();
            var project = EntityHelper.CreateProject(1, agency, tier, status);

            var tasks = EntityHelper.CreateDefaultTasks();
            var task = EntityHelper.CreateTask(20, "test tasks");
            init.AddAndSaveRange(tasks).AddAndSaveChanges(task);

            project.Status.Tasks.Add(task);
            init.UpdateAndSaveChanges(project.Status);

            project.Tasks.Add(new Entity.ProjectTask(project, task));

            var options = Options.Create(new PimsOptions() { Project = new ProjectOptions() { NumberFormat = "TEST-{0:00000}" } });
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var result = service.Add(project);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(project, result);
            Assert.Equal(1, result.StatusId);
            Assert.Single(result.Tasks);
        }

        [Fact]
        public void Add_DefaultTasks()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectAdd).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var agency = init.Agencies.Find(1);
            var tier = init.TierLevels.Find(1);
            var status = init.Workflows.Find(1).Status.First();
            var project = EntityHelper.CreateProject(1, agency, tier, status);

            var tasks = EntityHelper.CreateDefaultTasks(project.Status);
            init.AddAndSaveRange(tasks);

            var options = Options.Create(new PimsOptions() { Project = new ProjectOptions() { NumberFormat = "TEST-{0:00000}" } });
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var result = service.Add(project);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(project, result);
            Assert.Equal(1, result.StatusId);
            Assert.Equal(tasks.Count(), result.Tasks.Count());
        }

        [Fact]
        public void Add_DefaultResponses()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectAdd).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var agency = init.Agencies.Find(1);
            var tier = init.TierLevels.Find(1);
            var status = init.Workflows.Find(1).Status.First();
            var project = EntityHelper.CreateProject(1, agency, tier, status);

            var response = EntityHelper.CreateResponse(project.Id, project.AgencyId);
            project.Responses.Add(response);


            var options = Options.Create(new PimsOptions() { Project = new ProjectOptions() { NumberFormat = "TEST-{0:00000}" } });
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var result = service.Add(project);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(project, result);
            Assert.Equal(1, result.StatusId);
            result.Responses.Should().BeEquivalentTo(new List<ProjectAgencyResponse>() { response });
        }

        [Fact]
        public void Add_NoProject_Throws_ArgumentNullException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectAdd);

            var service = helper.CreateService<ProjectService>(user);

            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => service.Add(null));
        }

        [Fact]
        public void Add_Permission_Throws_NotAuthorized()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView);
            var project = EntityHelper.CreateProject(1);

            helper.CreatePimsContext(user).AddAndSaveChanges(project.Agency);

            var options = Options.Create(new PimsOptions() { Project = new ProjectOptions() { NumberFormat = "TEST-{0:00000}" } });
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            // Assert
            Assert.Throws<NotAuthorizedException>(() => service.Add(project));
        }

        [Fact]
        public void Add_NoAgency_Throws_NotAuthorized()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectAdd);
            var project = EntityHelper.CreateProject(1);

            helper.CreatePimsContext(user).AddAndSaveChanges(project.Agency);

            var options = Options.Create(new PimsOptions() { Project = new ProjectOptions() { NumberFormat = "TEST-{0:00000}" } });
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            // Assert
            Assert.Throws<NotAuthorizedException>(() => service.Add(project));
        }

        [Fact]
        public void Add_Agency_Throws_NotAuthorized()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectAdd).AddAgency(2);
            var project = EntityHelper.CreateProject(1);

            helper.CreatePimsContext(user).AddAndSaveChanges(project.Agency);

            var options = Options.Create(new PimsOptions() { Project = new ProjectOptions() { NumberFormat = "TEST-{0:00000}" } });
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            // Assert
            Assert.Throws<NotAuthorizedException>(() => service.Add(project));
        }
        #endregion

        #region Update
        [Fact]
        public void Update()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.ProjectNumber);
            projectToUpdate.Description = "A new description";
            var result = service.Update(projectToUpdate);

            // Assert
            Assert.NotNull(result);
            result.Should().BeEquivalentTo(projectToUpdate, options => options.Excluding(o => o.SelectedMemberPath.Contains("Updated")));
            Assert.Equal("A new description", result.Description);
        }

        [Fact]
        public void Update_Financials()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1);
            project.ReportedFiscalYear = 2020;
            var parcel = init.CreateParcel(1, project.Agency);
            var buildings = init.CreateBuildings(parcel, 2, 5);
            init.SaveChanges();
            init.CreateEvaluations(parcel, new DateTime(2015, 1, 1), 6, Entity.EvaluationKeys.Assessed, 5);
            init.CreateFiscals(parcel, 2015, 6, Entity.FiscalKeys.Estimated, 5);
            init.CreateFiscals(parcel, 2015, 6, Entity.FiscalKeys.NetBook, 5);
            init.CreateEvaluations(buildings.Next(0), new DateTime(2015, 1, 1), 6, Entity.EvaluationKeys.Assessed, 5);
            init.CreateFiscals(buildings.Next(0), 2015, 6, Entity.FiscalKeys.Estimated, 5);
            init.CreateFiscals(buildings.Next(0), 2015, 6, Entity.FiscalKeys.NetBook, 5);
            project.AddProperty(parcel);
            buildings.ForEach(b => project.AddProperty(b));
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.Id);
            parcel.Evaluations.Where(e => e.Date.Year == project.ReportedFiscalYear).Single().Value = 10;
            parcel.Fiscals.Where(f => f.Key == Entity.FiscalKeys.Estimated && f.FiscalYear == project.ReportedFiscalYear).Single().Value = 10;
            parcel.Fiscals.Where(f => f.Key == Entity.FiscalKeys.NetBook && f.FiscalYear == project.ReportedFiscalYear).Single().Value = 10;
            var result = service.Update(projectToUpdate);

            // Assert
            Assert.NotNull(result);
            Assert.IsAssignableFrom<Entity.Project>(result);
            project.Estimated.Should().Be(15);
            project.NetBook.Should().Be(15);
            project.Assessed.Should().Be(15);
        }

        [Fact]
        public void Update_SimpleFields()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.ProjectNumber);
            projectToUpdate.Description = "A new description";
            projectToUpdate.PrivateNote = "private Note";
            projectToUpdate.PublicNote = "public Note";
            projectToUpdate.SubmittedOn = new DateTime();
            projectToUpdate.ApprovedOn = new DateTime().AddDays(1);
            projectToUpdate.DeniedOn = new DateTime().AddDays(2);

            service.Update(projectToUpdate);
            var result = service.Get(projectToUpdate.Id);

            // Assert
            Assert.NotNull(result);
            result.Should().BeEquivalentTo(projectToUpdate, options => options.Excluding(o => o.SelectedMemberPath.Contains("Updated")));
            Assert.Equal("A new description", result.Description);
            Assert.Equal("private Note", result.PrivateNote);
            Assert.Equal("public Note", result.PublicNote);
            Assert.Equal(projectToUpdate.SubmittedOn, result.SubmittedOn);
            Assert.Equal(projectToUpdate.ApprovedOn, result.ApprovedOn);
            Assert.Equal(projectToUpdate.DeniedOn, result.DeniedOn);
        }

        [Fact]
        public void Update_AsAdmin()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.AdminProjects).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.ProjectNumber);
            projectToUpdate.Description = "A new description";
            service.Update(projectToUpdate);
            var result = service.Get(project.ProjectNumber);

            // Assert
            Assert.NotNull(result);
            projectToUpdate.Should().BeEquivalentTo(result, options => options.Excluding(x => x.SelectedMemberPath.Contains("Updated")));
            Assert.Equal("A new description", result.Description);
        }

        [Fact]
        public void Update_Task()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1);
            var task = init.CreateTask(20, "testing", project.Status);
            init.AddAndSaveChanges(task);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.ProjectNumber);
            projectToUpdate.AddTask(task);
            var result = service.Update(projectToUpdate);

            // Assert
            Assert.NotNull(result);
            projectToUpdate.Should().BeEquivalentTo(result);
            Assert.Single(result.Tasks);
        }

        [Fact]
        public void Update_AddParcel()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1);
            var parcel = init.CreateParcel(1, project.Agency);

            init.AddAndSaveChanges(parcel);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.ProjectNumber);
            projectToUpdate.AddProperty(parcel);
            parcel.ProjectNumber = null;
            service.Update(projectToUpdate);
            var result = service.Get(project.ProjectNumber);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Properties);
            result.Should().BeEquivalentTo(projectToUpdate, options => options
            .IgnoringCyclicReferences()
            .Excluding(x => x.SelectedMemberPath == "Properties[0].Parcel.Projects")
            .Excluding(x => x.SelectedMemberPath == "Properties[0].Id")
            .Excluding(x => x.SelectedMemberPath.Contains("Created")));
            Assert.Equal(projectToUpdate.ProjectNumber, result.Properties.FirstOrDefault().Parcel.ProjectNumber);
            Assert.Equal(Entity.PropertyTypes.Land, result.Properties.First().PropertyType);
        }

        [Fact]
        public void Update_Response()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var project = init.CreateProject(1);
            var response = init.CreateResponse(project.Id, project.AgencyId);
            init.AddAndSaveChanges(response);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.ProjectNumber);
            var result = service.Update(projectToUpdate);

            // Assert
            Assert.NotNull(result);
            result.Responses.Should().HaveCount(1);
        }

        /**
         * Only financials and classifications will be updated by the service. Other updates should be ignored.
         */
        [Fact]
        public void Update_UpdateParcel_IgnoredField()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var project = init.CreateProject(1);
            var parcel = init.CreateParcel(1, project.Agency);
            var updatedParcel = init.CreateParcel(2, project.Agency);
            project.AddProperty(parcel);
            init.AddAndSaveChanges(parcel);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.ProjectNumber);
            updatedParcel.Description = "updated";
            projectToUpdate.Properties.First().Parcel = updatedParcel;
            service.Update(projectToUpdate);
            var result = service.Get(project.ProjectNumber);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Properties);
            Assert.Equal(Entity.PropertyTypes.Land, result.Properties.First().PropertyType);
            Assert.Equal("description-1", result.Properties.First().Parcel.Description);
        }

        /**
         * Classification and financials are the only supported update fields
         */
        [Fact]
        public void Update_UpdateParcel_Supported()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var project = init.CreateProject(1);
            var parcel = init.CreateParcel(1, project.Agency);
            var parcelEvaluation = init.CreateEvaluation(parcel, DateTime.UtcNow);
            project.AddProperty(parcel);
            init.AddAndSaveChanges(parcel);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.ProjectNumber);
            projectToUpdate.Properties.First().Parcel.ClassificationId = 2;
            projectToUpdate.Properties.First().Parcel.Evaluations.Add(parcelEvaluation);
            service.Update(projectToUpdate);
            var result = service.Get(project.ProjectNumber);

            // Assert
            Assert.NotNull(result);
            result.Properties.Should().HaveCount(1);
            result.Properties.First().PropertyType.Should().Be(Entity.PropertyTypes.Land);
            result.Properties.First().Parcel.ClassificationId.Should().Be(2);
            result.Properties.First().Parcel.Evaluations.Should().HaveCount(2);
        }

        [Fact]
        public void Update_AddBuilding()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1);
            var parcel = init.CreateParcel(1, project.Agency);
            var building = init.CreateBuilding(parcel, 20);
            init.AddAndSaveChanges(building);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.ProjectNumber);
            projectToUpdate.AddProperty(building);
            building.ProjectNumber = null;
            service.Update(projectToUpdate);
            var result = service.Get(project.ProjectNumber);

            // Assert
            Assert.NotNull(result);
            result.Properties.Should().HaveCount(1);
            result.Should().BeEquivalentTo(projectToUpdate, options => options
            .IgnoringCyclicReferences()
            .Excluding(x => x.SelectedMemberPath == "Properties[0].Building.Projects")
            .Excluding(x => x.SelectedMemberPath == "Properties[0].Building.Parcel")
            .Excluding(x => x.SelectedMemberPath == "Properties[0].Building.Agency.Parcels")
            .Excluding(x => x.SelectedMemberPath == "Properties[0].Id")
            .Excluding(x => x.SelectedMemberPath.Contains("Created")));
            Assert.Equal(projectToUpdate.ProjectNumber, result.Properties.FirstOrDefault().Building.ProjectNumber);
            result.Properties.First().PropertyType.Should().Be(Entity.PropertyTypes.Building);
        }

        /**
         * Only financials and classifications will be updated by the service. Other updates should be ignored.
         */
        [Fact]
        public void Update_UpdateBuilding_IgnoredField()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var project = init.CreateProject(1);
            var parcel = init.CreateParcel(1, project.Agency);
            var building = init.CreateBuilding(parcel, 20);
            var newBuilding = init.CreateBuilding(parcel, 21);
            project.AddProperty(building);
            init.AddAndSaveChanges(building);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.ProjectNumber);
            newBuilding.Description = "updated";
            projectToUpdate.Properties.First().Building = newBuilding;
            service.Update(projectToUpdate);
            var result = service.Get(project.ProjectNumber);

            // Assert
            Assert.NotNull(result);
            result.Properties.Should().HaveCount(1);
            result.Properties.First().PropertyType.Should().Equals(Entity.PropertyTypes.Building);
            result.Properties.First().Building.Description.Should().Equals("description-20");
        }

        /**
         * Classification and financials are the only supported update fields
         */
        [Fact]
        public void Update_UpdateBuilding_Supported()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var project = init.CreateProject(1);
            var parcel = init.CreateParcel(1, project.Agency);
            var building = init.CreateBuilding(parcel, 20);
            var newClassification = init.PropertyClassifications.Find(2);
            var parcelEvaluation = init.CreateEvaluation(building, DateTime.UtcNow);
            project.AddProperty(building);
            init.AddAndSaveChanges(building);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.ProjectNumber);
            projectToUpdate.Properties.First().Building.Classification = newClassification;
            projectToUpdate.Properties.First().Building.ClassificationId = 2;
            projectToUpdate.Properties.First().Building.Evaluations.Add(parcelEvaluation);
            service.Update(projectToUpdate);
            var result = service.Get(project.ProjectNumber);

            // Assert
            Assert.NotNull(result);
            result.Properties.Should().HaveCount(1);
            result.Properties.First().PropertyType.Should().Equals(Entity.PropertyTypes.Building);
            result.Properties.First().Building.ClassificationId.Should().Equals(2);
            result.Properties.First().Building.Evaluations.Should().HaveCount(2);
        }

        [Fact]
        public void Update_NoProject_Throws_ArgumentNullException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit);

            var service = helper.CreateService<ProjectService>(user);

            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => service.Update(null));
        }

        [Fact]
        public void Update_Permission_Throws_NotAuthorized()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView);
            var project = EntityHelper.CreateProject(1);

            helper.CreatePimsContext(user).AddAndSaveChanges(project.Agency);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            // Assert
            Assert.Throws<NotAuthorizedException>(() => service.Update(project));
        }

        [Fact]
        public void Update_NoAgency_Throws_NotAuthorized()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit);
            var project = EntityHelper.CreateProject(1);

            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            // Assert
            Assert.Throws<NotAuthorizedException>(() => service.Update(project));
        }

        [Fact]
        public void Update_Agency_Throws_NotAuthorized()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(2);
            var project = EntityHelper.CreateProject(1);

            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            // Assert
            Assert.Throws<NotAuthorizedException>(() => service.Update(project));
        }

        [Fact]
        public void Update_ChangeAgency_Throws_NotAuthorized()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);
            var project = EntityHelper.CreateProject(1);

            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(project.ProjectNumber);
            projectToUpdate.AgencyId = 2;

            // Assert
            Assert.Throws<NotAuthorizedException>(() => service.Update(projectToUpdate));
        }

        [Fact]
        public void Update_ProjectParcelAgencyMismatch_Throws_BusinessException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.PropertyEdit, Permissions.PropertyView, Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            using var init = helper.InitializeDatabase(user);
            var project = init.CreateProject(1);
            var parcel = init.CreateParcel(1);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            parcel.AgencyId = 2;
            var projectToUpdate = service.Get(project.ProjectNumber);
            projectToUpdate.AddProperty(parcel);

            // Assert
            Assert.Throws<InvalidOperationException>(() => service.Update(projectToUpdate));
        }

        [Fact]
        public void Update_ProjectBuildingAgencyMismatch_Throws_BusinessException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.PropertyEdit, Permissions.PropertyView, Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            using var init = helper.InitializeDatabase(user);
            var project = init.CreateProject(1);
            var parcel = init.CreateParcel(1);
            var building = init.CreateBuilding(parcel, 2);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            building.AgencyId = 2;
            var projectToUpdate = service.Get(project.ProjectNumber);
            projectToUpdate.AddProperty(building);

            // Assert
            Assert.Throws<InvalidOperationException>(() => service.Update(projectToUpdate));
        }

        [Fact]
        public void Update_ParcelInProject_Throws_BusinessException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.PropertyEdit, Permissions.PropertyView, Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1);
            var newProject = init.CreateProject(2, project.Agency);
            var parcel = init.CreateParcel(1, project.Agency);
            parcel.ProjectNumber = project.ProjectNumber;
            project.AddProperty(parcel);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(newProject.ProjectNumber);
            projectToUpdate.AddProperty(parcel);

            // Assert
            Assert.Throws<InvalidOperationException>(() => service.Update(projectToUpdate));
        }

        [Fact]
        public void Update_BuildingInProject_Throws_BusinessException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.PropertyEdit, Permissions.PropertyView, Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1);
            var newProject = init.CreateProject(2, project.Agency);
            var parcel = init.CreateParcel(1, project.Agency);
            var building = init.CreateBuilding(parcel, 2, agency: project.Agency);
            building.ProjectNumber = project.ProjectNumber;
            project.AddProperty(parcel);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            options.Value.Project.NumberFormat = "TEST-{0:00000}";
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            var projectToUpdate = service.Get(newProject.ProjectNumber);
            projectToUpdate.AddProperty(building);

            // Assert
            Assert.Throws<InvalidOperationException>(() => service.Update(projectToUpdate));
        }

        #endregion

        #region Remove
        /// <summary>
        /// Project does not exist.
        /// </summary>
        [Fact]
        public async void Remove_KeyNotFound()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectDelete);
            var find = EntityHelper.CreateProject(1);
            var project = EntityHelper.CreateProject(2);
            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var service = helper.CreateService<ProjectService>(user);

            // Act
            // Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(async () =>
                await service.RemoveAsync(find));
        }

        /// <summary>
        /// User does not have 'property-delete' claim.
        /// </summary>
        [Fact]
        public async void Remove_NotAuthorized()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission();
            var project = EntityHelper.CreateProject(1);
            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var service = helper.CreateService<ProjectService>(user);

            // Act
            // Assert
            await Assert.ThrowsAsync<NotAuthorizedException>(async () =>
                await service.RemoveAsync(project));
        }

        /// <summary>
        /// User is attempting to view sensitive project from another agency.
        /// </summary>
        [Fact]
        public async void Remove_WrongAgency_NotAuthorized()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectDelete);
            var project = EntityHelper.CreateProject(1);
            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            // Act
            // Assert
            await Assert.ThrowsAsync<NotAuthorizedException>(async () =>
                await service.RemoveAsync(project));
        }

        /// <summary>
        /// User is attempting to view sensitive project from another agency.
        /// </summary>
        [Fact]
        public async void Remove_WrongAgency_AsAdmin()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectDelete, Permissions.AdminProjects);
            var project = EntityHelper.CreateProject(1);
            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);
            var context = helper.GetService<PimsContext>();
            var pimsService = helper.GetService<Mock<IPimsService>>();
            pimsService.Setup(m => m.NotificationQueue.CancelNotificationsAsync(It.IsAny<IEnumerable<Entity.NotificationQueue>>()));

            // Act
            await service.RemoveAsync(project);

            // Assert
            Assert.Equal(EntityState.Detached, context.Entry(project).State);
            pimsService.Verify(m => m.NotificationQueue.CancelNotificationsAsync(It.IsAny<IEnumerable<Entity.NotificationQueue>>()), Times.Once);
        }

        /// <summary>
        /// Project found.
        /// </summary>
        [Fact]
        public async void Remove_ActiveProject_NotAuthorizedException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectDelete).AddAgency(1);
            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1);
            init.SetStatus(project, "ASSESS-DISPOSAL", "AS-I");
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);
            var context = helper.GetService<PimsContext>();

            // Act
            await Assert.ThrowsAsync<NotAuthorizedException>(async () => await service.RemoveAsync(project));
        }

        /// <summary>
        /// Project found.
        /// </summary>
        [Fact]
        public async void Remove()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectDelete).AddAgency(1);
            var project = EntityHelper.CreateProject(1);
            helper.CreatePimsContext(user).AddAndSaveChanges(project);

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);
            var context = helper.GetService<PimsContext>();
            var pimsService = helper.GetService<Mock<IPimsService>>();
            pimsService.Setup(m => m.NotificationQueue.CancelNotificationsAsync(It.IsAny<IEnumerable<Entity.NotificationQueue>>()));

            // Act
            await service.RemoveAsync(project);

            // Assert
            Assert.Equal(EntityState.Detached, context.Entry(project).State);
            pimsService.Verify(m => m.NotificationQueue.CancelNotificationsAsync(It.IsAny<IEnumerable<Entity.NotificationQueue>>()), Times.Once);

        }
        #endregion

        #region SetStatus
        [Fact]
        public async void SetStatus_WithCode_InvalidWorkflow_KeyNotFoundException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var project = init.CreateProject(1, 1);

            var service = helper.CreateService<ProjectService>(user);

            var workflowCode = "code";

            // Act
            // Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(async () => await service.SetStatusAsync(project, workflowCode));
        }

        [Fact]
        public async void SetStatus_WithCode_InvalidStatus_KeyNotFoundException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1, 1);
            init.SaveChanges();
            project.StatusId = 999;

            var service = helper.CreateService<ProjectService>(user);

            // Act
            // Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_WithCode_NullProject_ArgumentNullException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultProjectStatus();
            var workflows = init.CreateDefaultWorkflows();
            init.SaveChanges();
            init.AddStatusToWorkflow(workflows.First(), init.ProjectStatus.Where(s => s.Id <= 6)).SaveChanges();

            var service = helper.CreateService<ProjectService>(user);

            var workflowCode = workflows.First().Code;
            var statusCode = init.ProjectStatus.Find(6).Id; // Submitted Status

            // Act
            // Assert
            await Assert.ThrowsAsync<ArgumentNullException>(async () => await service.SetStatusAsync(null, workflowCode));
        }

        [Fact]
        public async void SetStatus_NoProject_ArgumentNullException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflows();
            init.SaveChanges();
            init.AddStatusToWorkflow(workflows.First(), init.ProjectStatus.Where(s => s.Id <= 6)).SaveChanges();

            var service = helper.CreateService<ProjectService>(user);

            var workflowCode = workflows.First().Code;

            // Act
            // Assert
            await Assert.ThrowsAsync<ArgumentNullException>(async () => await service.SetStatusAsync(null, workflowCode));
        }

        [Fact]
        public async void SetStatus_NoRowVersion_RowVersionMissingException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-DISPOSAL", "AS-I");
            init.SaveChanges();
            project.RowVersion = null;

            var service = helper.CreateService<ProjectService>(user);

            var review = init.ProjectStatus.First(s => s.Code == "AS-D");
            project.StatusId = review.Id;

            // Act
            // Assert
            await Assert.ThrowsAsync<RowVersionMissingException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_NoPermission_NotAuthorizedException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-DISPOSAL", "AS-I");
            init.SaveChanges();

            var service = helper.CreateService<ProjectService>(user);

            var review = init.ProjectStatus.First(s => s.Code == "AS-D");
            project.StatusId = review.Id;

            // Act
            // Assert
            await Assert.ThrowsAsync<NotAuthorizedException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_NullWorkflow_ArgumentNullException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-DISPOSAL", "AS-I");
            init.SaveChanges();

            var service = helper.CreateService<ProjectService>(user);

            var review = init.ProjectStatus.First(s => s.Code == "AS-D");
            project.StatusId = review.Id;

            // Act
            // Assert
            await Assert.ThrowsAsync<ArgumentNullException>(async () => await service.SetStatusAsync(project, (Entity.Workflow)null));
        }

        [Fact]
        public async void SetStatus_InvalidProject_KeyNotFoundException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();

            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-DISPOSAL", "AS-I");
            init.SaveChanges();

            var service = helper.CreateService<ProjectService>(user);

            var find = init.CreateProject(2, 1);
            find.StatusId = init.ProjectStatus.Find(6).Id; // Submitted Status

            // Act
            // Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(async () => await service.SetStatusAsync(find, find.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_WrongAgency_NotAuthorizedException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(2);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-DISPOSAL", "AS-I");
            init.SaveChanges();

            var service = helper.CreateService<ProjectService>(user);

            var review = init.ProjectStatus.First(s => s.Code == "AS-D");
            project.StatusId = review.Id;

            // Act
            // Assert
            await Assert.ThrowsAsync<NotAuthorizedException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_InvalidTransition_InvalidOperationException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-DISPOSAL", "AS-I");
            init.SaveChanges();

            var service = helper.CreateService<ProjectService>(user);

            var review = init.ProjectStatus.First(s => s.Code == "AS-AP");
            project.StatusId = review.Id;

            // Act
            // Assert
            await Assert.ThrowsAsync<InvalidOperationException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_IncompleteTasks_InvalidOperationException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SaveChanges();
            var draft = init.ProjectStatus.First(s => s.Code == "DR");
            var addProperties = init.ProjectStatus.First(s => s.Code == "DR-P");
            var task = init.CreateTask(1, "Documentation", draft);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var workflowCode = workflows.First().Code;
            project.StatusId = addProperties.Id; // Deny Status

            // Act
            // Assert
            await Assert.ThrowsAsync<InvalidOperationException>(async () => await service.SetStatusAsync(project, workflowCode));
        }

        [Fact]
        public async void SetStatus_Deny_Success()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-DISPOSAL", "AS-FNC");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var deny = init.ProjectStatus.First(s => s.Code == "DE");
            project.StatusId = deny.Id; // Deny Status

            // Act
            project.PublicNote = "this is the reason";
            var result = await service.SetStatusAsync(project, project.Workflow.Code);

            // Assert
            Assert.NotNull(result);
            result.StatusId.Should().Be(deny.Id);
            result.Status.Should().Be(deny);
            result.DeniedOn.Should().NotBeNull();
            parcel.ProjectNumber.Should().BeNull();
        }

        [Fact]
        public async void SetStatus_Cancel_Success()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ERP", "ERP-ON");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);
            var pimsService = helper.GetService<Mock<IPimsService>>();
            pimsService.Setup(m => m.NotificationQueue.CancelNotificationsAsync(It.IsAny<IEnumerable<Entity.NotificationQueue>>()));

            var cancel = init.ProjectStatus.First(s => s.Code == "CA");
            project.StatusId = cancel.Id; // Cancel Status

            // Act
            var result = await service.SetStatusAsync(project, project.Workflow.Code);

            // Assert
            Assert.NotNull(result);
            result.StatusId.Should().Be(cancel.Id);
            result.Status.Should().Be(cancel);
            result.CancelledOn.Should().NotBeNull();
            parcel.ProjectNumber.Should().BeNull();
            pimsService.Verify(m => m.NotificationQueue.CancelNotificationsAsync(It.IsAny<IEnumerable<Entity.NotificationQueue>>()), Times.Once);
        }

        [Fact]
        public async void SetStatus_OnHold_Success()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ERP", "ERP-ON");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            project.OnHoldNotificationSentOn = DateTime.Now; // required for On Hold.
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var onHold = init.ProjectStatus.First(s => s.Code == "ERP-OH");
            project.StatusId = onHold.Id; // On Hold Status

            // Act
            var result = await service.SetStatusAsync(project, project.Workflow.Code);

            // Assert
            Assert.NotNull(result);
            result.StatusId.Should().Be(onHold.Id);
            result.Status.Should().Be(onHold);
            result.OnHoldNotificationSentOn.Should().NotBeNull();
        }

        [Fact]
        public async void SetStatus_OnHold_InvalidOperationException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ERP", "ERP-ON");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var onHold = init.ProjectStatus.First(s => s.Code == "ERP-OH");
            project.StatusId = onHold.Id; // On Hold Status

            // Act
            await Assert.ThrowsAsync<InvalidOperationException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_TransferredWithinGre_Success()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ERP", "ERP-ON");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            project.TransferredWithinGreOn = DateTime.Now; // required for Transferred within GRE.
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var transferredWithinGre = init.ProjectStatus.First(s => s.Code == "T-GRE");
            project.StatusId = transferredWithinGre.Id; // Transferred within GRE Status

            EntityHelper.CreateAgency(2);
            parcel.AgencyId = 2;
            EntityHelper.CreatePropertyClassification(2, "new classification");
            parcel.ClassificationId = 2;
            project.Properties.First().Parcel = parcel;

            // Act
            var result = await service.SetStatusAsync(project, project.Workflow.Code);

            // Assert
            Assert.NotNull(result);
            result.StatusId.Should().Be(transferredWithinGre.Id);
            result.Status.Should().Be(transferredWithinGre);
            result.TransferredWithinGreOn.Should().NotBeNull();
            var property = result.Properties.First().Parcel;
            property.ProjectNumber.Should().BeNull();
            property.AgencyId.Should().Be(2);
            property.ClassificationId.Should().Be(2);
        }

        [Fact]
        public async void SetStatus_TransferredWithinGre_InvalidOperationException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ERP", "ERP-ON");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var transferredWithinGre = init.ProjectStatus.First(s => s.Code == "T-GRE");
            project.StatusId = transferredWithinGre.Id; // Transferred within GRE Status

            // Act
            await Assert.ThrowsAsync<InvalidOperationException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_ApprovedForSpl_Success()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.DisposeApprove, Permissions.AdminProjects, Permissions.ProjectView).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "SPL", "AP-SPL");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            project.ClearanceNotificationSentOn = DateTime.Now; // required for Approved for SPL.
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var clearanceNotificationSentOn = init.ProjectStatus.First(s => s.Code == "AP-SPL");
            project.StatusId = clearanceNotificationSentOn.Id; // Approved for SPL status

            EntityHelper.CreateAgency(2);
            parcel.AgencyId = 2;
            EntityHelper.CreatePropertyClassification(2, "new classification");
            parcel.ClassificationId = 2;
            project.Properties.First().Parcel = parcel;

            // Act
            var result = await service.SetStatusAsync(project, project.Workflow.Code);

            // Assert
            Assert.NotNull(result);
            result.StatusId.Should().Be(clearanceNotificationSentOn.Id);
            result.Status.Should().Be(clearanceNotificationSentOn);
            result.ClearanceNotificationSentOn.Should().NotBeNull();
            var property = result.Properties.First().Parcel;
            property.AgencyId.Should().Be(2);
            property.ClassificationId.Should().Be(2);
            property.IsVisibleToOtherAgencies.Should().BeFalse();
        }

        [Fact]
        public async void SetStatus_ApprovedForSpl_InvalidOperationException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.DisposeApprove, Permissions.AdminProjects, Permissions.ProjectView).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "SPL", "AP-SPL");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var transferredWithinGre = init.ProjectStatus.First(s => s.Code == "AP-SPL");
            project.StatusId = transferredWithinGre.Id; // Approved for SPL status.

            // Act
            await Assert.ThrowsAsync<InvalidOperationException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatusAsync_NotInSpl_Success()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.DisposeApprove, Permissions.AdminProjects, Permissions.ProjectView).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ERP", "AP-!SPL");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            project.ClearanceNotificationSentOn = DateTime.Now; // required for Not in SPL.
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var clearanceNotificationSentOn = init.ProjectStatus.First(s => s.Code == "AP-!SPL");
            project.StatusId = clearanceNotificationSentOn.Id; // Not in SPL status

            EntityHelper.CreateAgency(2);
            parcel.AgencyId = 2;
            EntityHelper.CreatePropertyClassification(2, "new classification");
            parcel.ClassificationId = 2;
            project.Properties.First().Parcel = parcel;

            // Act
            var result = await service.SetStatusAsync(project, project.Workflow.Code);

            // Assert
            Assert.NotNull(result);
            result.StatusId.Should().Be(clearanceNotificationSentOn.Id);
            result.Status.Should().Be(clearanceNotificationSentOn);
            result.ClearanceNotificationSentOn.Should().NotBeNull();
            var property = result.Properties.First().Parcel;
            property.AgencyId.Should().Be(2);
            property.ClassificationId.Should().Be(2);
            property.IsVisibleToOtherAgencies.Should().BeFalse();
        }

        [Fact]
        public async void SetStatusAsync_NotInSpl_InvalidOperationException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.DisposeApprove, Permissions.AdminProjects, Permissions.ProjectView).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ERP", "AP-!SPL");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var transferredWithinGre = init.ProjectStatus.First(s => s.Code == "AP-!SPL");
            project.StatusId = transferredWithinGre.Id; // Not in SPL status.

            // Act
            await Assert.ThrowsAsync<InvalidOperationException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_Submit_NotAuthorizedException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            var erp = init.ProjectStatus.First(s => s.Code == "DR-RE");
            project.StatusId = erp.Id; // Review
            project.Status = erp;
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var submit = init.ProjectStatus.First(s => s.Code == "AS-I");
            project.StatusId = submit.Id; // Submit Status

            // Act
            // Assert
            await Assert.ThrowsAsync<NotAuthorizedException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_Submit_Success()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit, Permissions.DisposeRequest).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            var erp = init.ProjectStatus.First(s => s.Code == "DR-RE");
            project.StatusId = erp.Id; // Review
            project.Status = erp;
            project.ProjectNumber = "TEST";
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var submit = init.ProjectStatus.First(s => s.Code == "AS-I");
            project.StatusId = submit.Id; // Submit Status

            // Act
            var result = await service.SetStatusAsync(project, project.Workflow.Code);

            // Assert
            Assert.NotNull(result);
            result.StatusId.Should().Be(submit.Id);
            result.Status.Should().Be(submit);
            result.DeniedOn.Should().BeNull();
            result.SubmittedOn.Should().NotBeNull();
            result.ProjectNumber.Should().StartWith("SPP-");
            parcel.ProjectNumber.Should().Be(project.ProjectNumber);
        }

        [Fact]
        public async void SetStatus_ApproveERP_NotAuthorizedException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-DISPOSAL", "AS-FNC");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var approve = init.ProjectStatus.First(s => s.Code == "AP-ERP");
            project.StatusId = approve.Id; // Submit Status

            // Act
            // Assert
            await Assert.ThrowsAsync<NotAuthorizedException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_ApproveERP_Success()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit, Permissions.DisposeApprove).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-DISPOSAL", "AS-FNC");
            var parcel = init.CreateParcel(1);
            parcel.IsVisibleToOtherAgencies = false;
            project.AddProperty(parcel);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var approve = init.ProjectStatus.First(s => s.Code == "AP-ERP");
            project.StatusId = approve.Id; // Submit Status

            // Act
            var result = await service.SetStatusAsync(project, project.Workflow.Code);

            // Assert
            Assert.NotNull(result);
            result.StatusId.Should().Be(approve.Id);
            result.Status.Should().Be(approve);
            result.DeniedOn.Should().BeNull();
            result.ApprovedOn.Should().NotBeNull();
            parcel.IsVisibleToOtherAgencies.Should().BeTrue();
        }

        [Fact]
        public async void SetStatus_ApproveSPL_NotAuthorizedException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ERP", "ERP-OH");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var approve = init.ProjectStatus.First(s => s.Code == "AP-SPL");
            project.StatusId = approve.Id; // Submit Status

            // Act
            // Assert
            await Assert.ThrowsAsync<NotAuthorizedException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_ApproveSPL_Success()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit, Permissions.DisposeApprove).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ERP", "ERP-OH");
            var parcel = init.CreateParcel(1);
            parcel.IsVisibleToOtherAgencies = true;
            project.AddProperty(parcel);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var approve = init.ProjectStatus.First(s => s.Code == "AP-SPL");
            project.StatusId = approve.Id; // Submit Status
            project.ClearanceNotificationSentOn = DateTime.UtcNow;

            // Act
            var result = await service.SetStatusAsync(project, project.Workflow.Code);

            // Assert
            Assert.NotNull(result);
            result.StatusId.Should().Be(approve.Id);
            result.Status.Should().Be(approve);
            result.DeniedOn.Should().BeNull();
            result.ApprovedOn.Should().NotBeNull();
            parcel.IsVisibleToOtherAgencies.Should().BeFalse();
        }

        [Fact]
        public async void SetStatus_ApproveExemption_NotAuthorizedException()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectEdit).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-EXEMPTION", "AS-EXP");
            var parcel = init.CreateParcel(1);
            project.AddProperty(parcel);
            parcel.ProjectNumber = project.ProjectNumber;
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var approve = init.ProjectStatus.First(s => s.Code == "AP-EXE");
            project.StatusId = approve.Id; // Submit Status

            // Act
            // Assert
            await Assert.ThrowsAsync<NotAuthorizedException>(async () => await service.SetStatusAsync(project, project.Workflow.Code));
        }

        [Fact]
        public async void SetStatus_ApproveExemption_Success()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit, Permissions.DisposeApprove).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-EXEMPTION", "AS-EXP");
            var parcel = init.CreateParcel(1);
            parcel.IsVisibleToOtherAgencies = true;
            project.AddProperty(parcel);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var approve = init.ProjectStatus.First(s => s.Code == "AP-EXE");
            project.StatusId = approve.Id; // Submit Status
            project.ClearanceNotificationSentOn = DateTime.UtcNow;

            // Act
            var result = await service.SetStatusAsync(project, project.Workflow.Code);

            // Assert
            Assert.NotNull(result);
            result.StatusId.Should().Be(approve.Id);
            result.Status.Should().Be(approve);
            result.DeniedOn.Should().BeNull();
            result.ApprovedOn.Should().NotBeNull();
            parcel.IsVisibleToOtherAgencies.Should().BeTrue();
        }

        [Fact]
        public async void SetStatus_TransferredGreFromApprovedExemption_Success()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit, Permissions.DisposeApprove).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-EX-DISPOSAL", "AP-EXE");
            var parcel = init.CreateParcel(1);
            parcel.IsVisibleToOtherAgencies = true;
            project.AddProperty(parcel);
            project.ApprovedOn = DateTime.UtcNow;
            project.TransferredWithinGreOn = DateTime.UtcNow;
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var approve = init.ProjectStatus.First(s => s.Code == "T-GRE");
            project.StatusId = approve.Id; // Submit Status
            project.ClearanceNotificationSentOn = DateTime.UtcNow;

            // Act
            var result = await service.SetStatusAsync(project, project.Workflow.Code);

            // Assert
            Assert.NotNull(result);
            result.StatusId.Should().Be(approve.Id);
            result.Status.Should().Be(approve);
            result.DeniedOn.Should().BeNull();
            result.ApprovedOn.Should().NotBeNull();
            parcel.IsVisibleToOtherAgencies.Should().BeTrue();
        }

        [Fact]
        public async void SetStatus_ExemptionAddToSpl_Success()
        {
            // Arrange
            var helper = new TestHelper();
            var user = PrincipalHelper.CreateForPermission(Permissions.ProjectView, Permissions.ProjectEdit, Permissions.DisposeApprove).AddAgency(1);

            var init = helper.InitializeDatabase(user);
            var workflows = init.CreateDefaultWorkflowsWithStatus();
            init.SaveChanges();
            var project = init.CreateProject(1, 1);
            init.SetStatus(project, "ASSESS-EXEMPTION", "AS-EXP");
            var parcel = init.CreateParcel(1);
            parcel.IsVisibleToOtherAgencies = true;
            project.AddProperty(parcel);
            init.SaveChanges();

            var options = ControllerHelper.CreateDefaultPimsOptions();
            var service = helper.CreateService<ProjectService>(user, options);

            var approve = init.ProjectStatus.First(s => s.Code == "AP-SPL");
            project.StatusId = approve.Id; // Submit Status
            project.ClearanceNotificationSentOn = DateTime.UtcNow;

            // Act
            var result = await service.SetStatusAsync(project, project.Workflow.Code);

            // Assert
            Assert.NotNull(result);
            result.StatusId.Should().Be(approve.Id);
            result.Status.Should().Be(approve);
            result.DeniedOn.Should().BeNull();
            result.ApprovedOn.Should().NotBeNull();
            parcel.IsVisibleToOtherAgencies.Should().BeFalse();
        }
        #endregion

        #region Property Financials
        #endregion
        #endregion
    }
}
