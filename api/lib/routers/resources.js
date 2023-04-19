/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */


import Router from 'koa-router';

import Indicator from '../resource/model/indicator';
import Input from '../resource/model/input';
import Project from '../resource/model/project';
import Theme from '../resource/model/theme';
import User from '../resource/model/user';

const router = new Router();

import uuidv4 from "uuid/v4";
const isEqual = require("lodash.isequal");
const isArray = require("lodash.isarray");

const cloneDeep = (x) => {
  return JSON.parse(JSON.stringify(x));
};

/**
 * Get current logged in account information
 * This is used by the client to check if current session is valid and learn user name for display purposes.
 */
router.get('/resources/myself', async ctx => {
	ctx.response.body = ctx.state.user;
});

/**
 * Retrieve multiple projects.
 *
 * Multiple modes are supported
 * 		- no parameter: Retrieve all projects.
 *		- ?mode=short: Retrieve all projects (only country, name, themes, and current user).
 *		- ?mode=crossCutting&indicatorId=123: Retrieve projects that collect indicator 123 (bare minimum to compute indicator from cubes).
 */
router.get('/resources/project', async ctx => {
	let projects;
	if (ctx.state.user.type === 'user' && ctx.request.query.mode === 'short')
		projects = await Project.storeInstance.listShort(ctx.state.user._id);

	else {
		if (ctx.request.query.mode === 'crossCutting')
			projects = await Project.storeInstance.listByIndicator(ctx.request.query.indicatorId, true);
		else if (ctx.request.query.mode === undefined)
			projects = await Project.storeInstance.list();
		else
			throw new Error('invalid_mode');

		// listShort, listByIndicator and list require a post processing step
		// to hide passwords (which is not the case for listShort)
		projects = projects.map(p => p.toAPI())
	}

	// Filter projects depending on ACL.
	ctx.response.body = projects.filter(p => ctx.visibleProjectIds.has(p._id));
})

/**
 * Retrieve one project
 */
router.get('/resources/project/:id', async ctx => {
	const project = await Project.storeInstance.get(ctx.params.id);

	// add name of users
	const projectUserIds = project.users.map(u => u.id).filter(u => !!u);
	const users = await User.storeInstance.list();
	users.forEach(u => {
		if (projectUserIds.includes(u._id)) {
			const projUser = project.users.find(pu => pu.id === u._id);
			projUser.name = u.name;
		}
	})

	if (!ctx.visibleProjectIds.has(ctx.params.id))
		throw new Error('forbidden');

	ctx.response.body = project.toAPI();
});


/**
 * Retrieve one project
 */
router.get('/resources/project/:id/revisions', async ctx => {
	const revisions = await Project.storeInstance.listRevisions(
		ctx.params.id,
		ctx.request.query.offset,
		ctx.request.query.limit
	);

	if (!ctx.visibleProjectIds.has(ctx.params.id))
		throw new Error('forbidden');

	ctx.response.body = revisions;
});


/**
 * Save a project
 */
router.put('/resources/project/:id', async ctx => {
	// User is cloning a project
	if (ctx.request.query.from) {
		// Check that destination id is valid.
		if (!/^project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(ctx.params.id))
			throw new Error('invalid_data');

		// This is a project creation, make sure that user is not a partner and has permission.
		const u = ctx.state.user;
		const isAllowed = u.type === 'user' && (u.role === 'admin' || u.role === 'project');
		if (!isAllowed)
			throw new Error('forbidden');

		// If the destination id is taken, this is forbidden (we won't overwrite).
		try {
			await Project.storeInstance.get(ctx.params.id);
			throw new Error('forbidden');
		}
		catch (error) {
			if (error.message !== 'missing')
				throw error;
		}

		// Let fetch the origin project, and check that our user can access it legally
		const project = await Project.storeInstance.get(ctx.request.query.from);
		if (project.visibility === 'private' && !project.users.find(u => u.id === ctx.state.user._id))
			throw new Error('forbidden');

		// Clone the project
		project._id = ctx.params.id;
		delete project._rev;
		project.users = [{type: "internal", id: ctx.state.user._id, role: "owner"}];

		if (ctx.request.query.with_data == 'true'){
			project.name = 'CLONE - ' + project.name;
			project.country = 'CLONE - ' + project.country;
		} else{
			project.name = 'CLONE STRUCTURE - ' + project.name;
			project.country = 'CLONE STRUCTURE - ' + project.country;
		}
		await project.save();

		// Recreate all inputs asynchronously. No need to have the user waiting.
		if (ctx.request.query.with_data == 'true')
			Input.storeInstance.listByProject(ctx.request.query.from).then(inputs => {
				inputs.forEach(input => {
					input._id = 'input:' + project._id + ':' + input.form + ':' + input.entity + ':' + input.period;
					delete input._rev;
					input.project = project._id;
				});

				Input.storeInstance.bulkSave(inputs);
			});

		ctx.response.body = project.toAPI();
	}
	// User is saving a project
	else {
		// Validate that the _id in the payload is the same as the id in the URL.
		if (ctx.request.body._id !== ctx.params.id)
			throw new Error('id_mismatch');

		// Get old project
		let oldProject = null;
		try {
			oldProject = await Project.storeInstance.get(ctx.params.id);
		}
		catch (error) {
			if (error.message !== 'missing')
				throw error;
		}

		// Check ACLS
		if (oldProject) {
			// This is a project update, we need to make sure that user is owner.
			if ('owner' !== oldProject.getRole(ctx.state.user))
				throw new Error('forbidden');
		}
		else {
			// This is a project creation, make sure that user is not a partner and has permission.
			let u = ctx.state.user;
			let isAllowed = u.type === 'user' && (u.role === 'admin' || u.role === 'project');
			if (!isAllowed)
				throw new Error('forbidden');
		}

		const newProject = new Project(ctx.request.body);
		await newProject.save(false, ctx.state.user);

		ctx.response.body = newProject.toAPI();
	}
})

/**
 * Retrieve a list of inputs, or inputs ids.
 *
 * Multiple modes are supported
 * 		- ids_by_form: retrieve all input ids that match a given projectId and formId
 * 		- current+last: retrieve a given input and the previous one (with projectId, formId, entityId & period)
 */
router.get('/resources/input', async ctx => {
	const q = ctx.request.query;

	if (q.mode && q.mode.startsWith('ids_by_')) {
		let ids;
		if (q.mode === 'ids_by_form'){
			ids = await Input.storeInstance.listIdsByDataSource(q.projectId, q.formId, true);
		}
		else
			throw new Error('invalid_mode');

		ctx.response.body = Object.keys(ids)
			.filter(inputId => ctx.visibleProjectIds.has(inputId.substr(6, 44)))
			.reduce((m, e) => { m[e] = ids[e]; return m; }, {});
	}
	else {
		let inputs;
		if (q.mode === 'current+last')
			inputs = await Input.storeInstance.getLasts(q.projectId, q.formId, q.entityId, q.period, true);
		else
			throw new Error('invalid_mode');

		ctx.response.body = inputs
			.filter(input => ctx.visibleProjectIds.has(input.project))
			.map(input => input.toAPI());
	}
});


/**
 * Retrieve one input by id
 */
router.get('/resources/input/:id', async ctx => {
	const input = await Input.storeInstance.get(ctx.params.id);

	// Update the input before sending
	const project = await Project.storeInstance.get(input.project);
	input.update(project.getDataSourceById(input.form).structure);

	// Check if user is allowed (lazy way).
	if (!ctx.visibleProjectIds.has(input.project))
		throw new Error('forbidden');

	ctx.response.body = input.toAPI();
});


/**
 * Save an input
 */
router.put('/resources/input/:id', async ctx => {
	// Validate that the _id in the payload is the same as the id in the URL.
	if (ctx.request.body._id !== ctx.params.id)
		throw new Error('id_mismatch');

	const input = new Input(ctx.request.body);
	const project = await Project.storeInstance.get(input.project);

	// Check ACLs
	const projectUser = project.getProjectUser(ctx.state.user);
	const projectRole = project.getRole(ctx.state.user);

	const allowed =
		(projectRole === 'owner') ||
		(projectRole === 'input' && projectUser.entities.includes(input.entity) && projectUser.dataSources.includes(input.form));

	if (!allowed)
		throw new Error('forbidden');

	await input.save();
	ctx.response.body = input.toAPI();
})

/**
 * Delete an input.
 */
router.delete('/resources/input/:id', async ctx => {
	const input = await Input.storeInstance.get(ctx.params.id);
	const project = await Project.storeInstance.get(input.project);

	// Check ACLs
	const projectUser = project.getProjectUser(ctx.state.user);
	const projectRole = project.getRole(ctx.state.user);

	const allowed =
		(projectRole === 'owner') ||
		(projectRole === 'input' && projectUser.entities.includes(input.entity) && projectUser.dataSources.includes(input.form));

	if (!allowed)
		throw new Error('forbidden');

	ctx.response.body = await input.destroy();
})

/**
 * List indicators, themes, users
 * (Those are public data).
 */
router.get('/resources/:modelName(indicator|theme|user)', async ctx => {
	const Model = {indicator: Indicator, theme: Theme, user: User}[ctx.params.modelName];

	const models = await Model.storeInstance.list();
	ctx.response.body = models.map(m => m.toAPI());
})

/**
 * Get an indicator, theme or user.
 */
router.get('/resources/:modelName(indicator|theme|user)/:id', async ctx => {
	const Model = {indicator: Indicator, theme: Theme, user: User}[ctx.params.modelName];

	const model = await Model.storeInstance.get(ctx.params.id);
	ctx.response.body = model.toAPI();
})

/**
 * Save an indicator, theme or user (need to be admin).
 */
router.put('/resources/:modelName(indicator|theme|user)/:id', async ctx => {
	// Only admin accounts can touch indicators, themes and users.
	if (ctx.state.user.role !== 'admin')
		throw new Error('forbidden');

	// Validate that the _id in the payload is the same as the id in the URL.
	if (ctx.request.body._id !== ctx.params.id)
		throw new Error('id_mismatch');

	// Save the model.
	const Model = {indicator: Indicator, theme: Theme, user: User}[ctx.params.modelName];
	const model = new Model(ctx.request.body);
	model.save();

	ctx.response.body = model.toAPI();
})

/**
 * Delete an indicator, theme or user (need to be admin).
 */
router.delete('/resources/:modelName(indicator|theme)/:id', async ctx => {
	// Only admin accounts can touch indicators, themes and users.
	if (ctx.state.user.role !== 'admin')
		throw new Error('forbidden');

	// Save the model.
	const Model = {indicator: Indicator, theme: Theme, user: User}[ctx.params.modelName];
	const model = await Model.storeInstance.get(ctx.params.id);

	ctx.response.body = await model.destroy()
});

/**
 * Saves a comment on the project structure.
 */
router.put("/resources/comment", async (ctx) => {
  const { comment } = ctx.request.body;
  if (!comment) throw new Error("missing_comment");
  const project = await Project.storeInstance.get(comment.project);
  if (!project) throw new Error("project_not_found");

  const matchesFilter = (filter, c) => {
    // check if both array have the same string, order doesn't matter
    const haveSameEntities = (a, b) => {
      if (!a || !b) return false;
      if (a.length !== b.length) return false;

      return a.every((e) => b.includes(e)) && b.every((e) => a.includes(e));
    };

    if (!c) return false;
    const { computation, customFilters, dateRange, dimensionId, entities } = c;
    if (computation && !isEqual(computation, filter.computation)) return false;
    if (customFilters && !isEqual(customFilters, filter.customFilters))
      return false;
    if (dateRange && !isEqual(dateRange, filter.dateRange)) return false;
    if (dimensionId && !isEqual(dimensionId, filter.dimensionId)) return false;
    if (entities && !haveSameEntities(entities, filter.entities)) return false;

    return true;
  };

  const findForFilter = (comments, filter) => {
    if (!comments) return null;
    return comments.find((c) => matchesFilter(c.filter, filter)) || null;
  };

  // logical frame comments / name and goal
  if (comment.type === "logicalFrame") {
    const logicalFrame = project.logicalFrames.find((x) => x.id === comment.id);
    if (comment.nameComment) {
      const allNameComments = logicalFrame.nameComment;
      const commentForFilter = allNameComments
        ? allNameComments.find((c) => matchesFilter(c.filter, comment.filter))
        : null;

      if (commentForFilter) commentForFilter.value = comment.nameComment;
      else if (allNameComments)
        allNameComments.push({
          value: comment.nameComment,
          filter: comment.filter,
        });
      else
        logicalFrame.nameComment = [
          {
            value: comment.nameComment,
            filter: comment.filter,
          },
        ];
    }
    if (comment.goalComment) {
      const allGoalComments = logicalFrame.goalComment;
      const commentForFilter = allGoalComments
        ? allGoalComments.find((c) => matchesFilter(c.filter, comment.filter))
        : null;

      if (commentForFilter) commentForFilter.value = comment.goalComment;
      else if (allGoalComments)
        allGoalComments.push({
          value: comment.goalComment,
          filter: comment.filter,
        });
      else
        logicalFrame.goalComment = [
          {
            value: comment.goalComment,
            filter: comment.filter,
          },
        ];
    }

    // indicator comments, either from logicalFrame or purpose
  } else if (comment.type === "indicator") {
    const indicatorID = comment.id;
    const logicalFrame = project.logicalFrames.find(
      (x) => x.id === comment.logicalFrame
    );

    let purpose = null;
    let output = null;
    let activity = null;
    const standaloneIndicator =
      typeof indicatorID === "string" && indicatorID.startsWith("indicator:")
        ? (await Indicator.storeInstance.get(indicatorID)) || null
        : null;

    const form = comment.form
      ? project.forms.find((x) => x.id === comment.form)
      : null;

    const formElement = form
      ? form.elements.find((x) => x.id === indicatorID)
      : null;

    const purposeID = comment.purpose;
    if (purposeID) {
      const purposes = logicalFrame.purposes.filter((p) => {
        return typeof purposeID === "string"
          ? p.id === purposeID
          : isEqual({ description: p.description }, purposeID);
      });

      // if found more than one, throw an error
      if (purposes.length > 1) throw new Error("multiple_purposes_found");

      purpose = purposes[0];
      if (!purpose) throw new Error("purpose_not_found");

      // creates id if not present
      if (!purpose.id) purpose.id = uuidv4();

      const outputID = comment.output;
      if (outputID) {
        const outputs = purpose.outputs.filter((o) => {
          return typeof outputID === "string"
            ? o.id === outputID
            : isEqual({ description: o.description }, outputID);
        });

        // if found more than one, throw an error
        if (outputs.length > 1) throw new Error("multiple_outputs_found");

        output = outputs[0];
        if (!output) throw new Error("output_not_found");

        // creates id if not present
        if (!output.id) output.id = uuidv4();

        const activityID = comment.activity;
        if (activityID) {
          const activities = output.activities.filter((a) => {
            return typeof activityID === "string"
              ? a.id === activityID
              : isEqual({ description: a.description }, activityID);
          });

          // if found more than one, throw an error
          if (activities.length > 1)
            throw new Error("multiple_activities_found");

          activity = activities[0];
          if (!activity) throw new Error("activity_not_found");

          // creates id if not present
          if (!activity.id) activity.id = uuidv4();
        }
      }
    }

    const indicators = (
      activity ||
      output ||
      purpose ||
      logicalFrame || { indicators: project.extraIndicators || [] }
    ).indicators.filter((ind) => {
      return typeof indicatorID === "string"
        ? ind.id === indicatorID
        : isEqual({ display: ind.display }, indicatorID);
    });

    if (standaloneIndicator) {
      const column = comment.column;
      if (!column) throw new Error("missing_column");
      const commentForFilter = findForFilter(
        standaloneIndicator.comments,
        comment.filter
      );
      const indComments = commentForFilter
        ? cloneDeep(commentForFilter.value)
        : {};

      // each key is a project id, making if possible to have different comments
      // on each of the tables that use the same shared indicator
      indComments[project._id] = indComments[project._id] || {};
      Object.assign(indComments[project._id], {
        [column]: comment.comment,
      });

      if (commentForFilter) commentForFilter.value = indComments;
      else if (!commentForFilter && isArray(standaloneIndicator.comments))
        standaloneIndicator.comments.push({
          filter: comment.filter,
          value: indComments,
        });
      else
        standaloneIndicator.comments = [
          { filter: comment.filter, value: indComments },
        ];
      // save indicator
      await standaloneIndicator.save();
    } else if (formElement) {
      const column = comment.column;
      if (!column) throw new Error("missing_column");

      const commentForFilter = findForFilter(
        formElement.comments,
        comment.filter
      );

      const elComments = commentForFilter
        ? cloneDeep(commentForFilter.value)
        : {};
      Object.assign(elComments, {
        [column]: comment.comment,
      });

      if (commentForFilter) commentForFilter.value = elComments;
      else if (!commentForFilter && isArray(formElement.comments))
        formElement.comments.push({
          filter: comment.filter,
          value: elComments,
        });
      else
        formElement.comments = [{ filter: comment.filter, value: elComments }];
    } else {
      // if found more than one, throw an error
      if (indicators.length > 1) throw new Error("multiple_indicators_found");
      const indicator = indicators[0];
      if (!indicator) throw new Error("indicator_not_found");

      // creates id if not present
      if (!indicator.id) indicator.id = uuidv4();

      const column = comment.column;
      if (!column) throw new Error("missing_column");

      const commentForFilter = findForFilter(
        indicator.comments,
        comment.filter
      );

      const indicatorComments = commentForFilter
        ? cloneDeep(commentForFilter.value)
        : {};
      Object.assign(indicatorComments, {
        [column]: comment.comment,
      });

      if (commentForFilter) commentForFilter.value = indicatorComments;
      else if (!commentForFilter && isArray(indicator.comments))
        indicator.comments.push({
          filter: comment.filter,
          value: indicatorComments,
        });
      else
        indicator.comments = [
          { filter: comment.filter, value: indicatorComments },
        ];
    }
    // purpose comments
  } else if (comment.type === "purpose") {
    const purposeID = comment.id;
    const logicalFrame = project.logicalFrames.find(
      (x) => x.id === comment.logicalFrame
    );

    const purposes = logicalFrame.purposes.filter((p) => {
      return typeof purposeID === "string"
        ? p.id === purposeID
        : isEqual({ description: p.description }, purposeID);
    });

    // if found more than one, throw an error
    if (purposes.length > 1) throw new Error("multiple_purposes_found");
    const purpose = purposes[0];
    if (!purpose) throw new Error("purpose_not_found");

    // creates id if not present
    if (!purpose.id) purpose.id = uuidv4();

    const commentForFilter = findForFilter(purpose.comment, comment.filter);
    if (commentForFilter) commentForFilter.value = comment.comment;
    else if (!commentForFilter && isArray(purpose.comment))
      purpose.comment.push({ filter: comment.filter, value: comment.comment });
    else purpose.comment = [{ filter: comment.filter, value: comment.comment }];
  } else if (comment.type === "output") {
    const outputID = comment.id;
    const logicalFrame = project.logicalFrames.find(
      (x) => x.id === comment.logicalFrame
    );

    const purposeID = comment.purpose;
    if (!purposeID) throw new Error("missing_purpose");

    const purposes = logicalFrame.purposes.filter((p) => {
      return typeof purposeID === "string"
        ? p.id === purposeID
        : isEqual({ description: p.description }, purposeID);
    });

    // if found more than one, throw an error
    if (purposes.length > 1) throw new Error("multiple_purposes_found");
    const purpose = purposes[0];
    if (!purpose) throw new Error("purpose_not_found");

    // creates id if not present
    if (!purpose.id) purpose.id = uuidv4();

    const outputs = purpose.outputs.filter((o) => {
      return typeof outputID === "string"
        ? o.id === outputID
        : isEqual({ description: o.description }, outputID);
    });

    // if found more than one, throw an error
    if (outputs.length > 1) throw new Error("multiple_outputs_found");
    const output = outputs[0];
    if (!output) throw new Error("output_not_found");

    // creates id if not present
    if (!output.id) output.id = uuidv4();

    const commentForFilter = findForFilter(output.comment, comment.filter);
    if (commentForFilter) commentForFilter.value = comment.comment;
    else if (!commentForFilter && isArray(output.comment))
      output.comment.push({ filter: comment.filter, value: comment.comment });
    else output.comment = [{ filter: comment.filter, value: comment.comment }];
  } else if (comment.type === "activity") {
    const logicalFrame = project.logicalFrames.find(
      (x) => x.id === comment.logicalFrame
    );

    const purposeID = comment.purpose;
    const outputID = comment.output;
    if (!purposeID) throw new Error("missing_purpose");

    const purposes = logicalFrame.purposes.filter((p) => {
      return typeof purposeID === "string"
        ? p.id === purposeID
        : isEqual({ description: p.description }, purposeID);
    });

    // if found more than one, throw an error
    if (purposes.length > 1) throw new Error("multiple_purposes_found");
    const purpose = purposes[0];
    if (!purpose) throw new Error("purpose_not_found");

    // creates id if not present
    if (!purpose.id) purpose.id = uuidv4();

    const outputs = purpose.outputs.filter((o) => {
      return typeof outputID === "string"
        ? o.id === outputID
        : isEqual({ description: o.description }, outputID);
    });

    // if found more than one, throw an error
    if (outputs.length > 1) throw new Error("multiple_outputs_found");
    const output = outputs[0];
    if (!output) throw new Error("output_not_found");

    // creates id if not present
    if (!output.id) output.id = uuidv4();

    const activityID = comment.id;
    if (!activityID) throw new Error("missing_activity");

    const activities = output.activities.filter((a) => {
      return typeof activityID === "string"
        ? a.id === activityID
        : isEqual({ description: a.description }, activityID);
    });

    // if found more than one, throw an error
    if (activities.length > 1) throw new Error("multiple_activities_found");
    const activity = activities[0];

    if (!activity) throw new Error("activity_not_found");

    // creates id if not present
    if (!activity.id) activity.id = uuidv4();

    const commentForFilter = findForFilter(activity.comment, comment.filter);
    if (commentForFilter) commentForFilter.value = comment.comment;
    else if (!commentForFilter && isArray(activity.comment))
      activity.comment.push({ filter: comment.filter, value: comment.comment });
    else
      activity.comment = [{ filter: comment.filter, value: comment.comment }];
  } else if (comment.type === "crossCutting") {
    const commentsForFilter = findForFilter(
      project.crossCuttingComments,
      comment.filter
    );
    const crossCuttingComments = commentsForFilter
      ? cloneDeep(commentsForFilter.value)
      : {};
    if (comment.nameComment)
      crossCuttingComments.nameComment = comment.nameComment;
    if (comment.multiThemeComment)
      crossCuttingComments.multiThemeComment = comment.multiThemeComment;

    if (commentsForFilter) commentsForFilter.value = crossCuttingComments;
    else if (!commentsForFilter && project.crossCuttingComments)
      project.crossCuttingComments.push({
        filter: comment.filter,
        value: crossCuttingComments,
      });
    else
      project.crossCuttingComments = [
        { filter: comment.filter, value: crossCuttingComments },
      ];
  } else if (comment.type === "theme") {
    const theme = await Theme.storeInstance.get(comment.id);
    if (!theme) throw new Error("theme_not_found");

    const commentForFilter = findForFilter(theme.comments, comment.filter);
    const themeComments = commentForFilter
      ? cloneDeep(commentForFilter.value)
      : {};
    Object.assign(themeComments, {
      [comment.project]: comment.comment,
    });

    if (commentForFilter) commentForFilter.value = themeComments;
    else if (!commentForFilter && isArray(theme.comments))
      theme.comments.push({
        filter: comment.filter,
        value: themeComments,
      });
    else theme.comments = [{ filter: comment.filter, value: themeComments }];
    // save theme
    await theme.save();
  } else if (comment.type === "extraIndicators") {
    const commentForFilter = findForFilter(
      project.extraIndicatorsComment,
      comment.filter
    );

    if (commentForFilter) commentForFilter.value = comment.comment;
    else if (!commentForFilter && isArray(project.extraIndicatorsComment))
      project.extraIndicatorsComment.push({
        filter: comment.filter,
        value: comment.comment,
      });
    else
      project.extraIndicatorsComment = [
        { filter: comment.filter, value: comment.comment },
      ];
  } else if (comment.type === "dataSource") {
    const form = project.forms.find((f) => f.id === comment.id);
    if (!form) throw new Error("form_not_found");

    const commentForFilter = findForFilter(form.comment, comment.filter);

    if (commentForFilter) commentForFilter.value = comment.comment;
    else if (!commentForFilter && isArray(form.comment))
      form.comment.push({ filter: comment.filter, value: comment.comment });
    else form.comment = [{ filter: comment.filter, value: comment.comment }];
  } else {
    throw new Error("invalid_comment_type");
  }

  // save the project
  await project.save();
  ctx.response.body = {};
});

export default router;