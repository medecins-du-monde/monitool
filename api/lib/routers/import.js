import Router from 'koa-router';
import {previewSite, commitSites} from '../import/multi-site';

const router = new Router();

/**
 * Validate the sheet of one site, and compare it with the existing data. Nothing is written.
 */
router.put('/resources/project/:id/data-source-all-sites/:dataSourceId/:period/:siteId/preview', async ctx => {
	if (!ctx.visibleProjectIds.has(ctx.params.id))
		throw new Error('forbidden');

	ctx.response.body = await previewSite({
		projectId: ctx.params.id,
		dataSourceId: ctx.params.dataSourceId,
		period: ctx.params.period,
		siteId: ctx.params.siteId,
		user: ctx.state.user,
		rows: ctx.request.body && ctx.request.body.data
	});
});

/**
 * Write the sites selected by the user: either all of them, or none.
 */
router.put('/resources/project/:id/data-source-all-sites/:dataSourceId/:period/commit', async ctx => {
	if (!ctx.visibleProjectIds.has(ctx.params.id))
		throw new Error('forbidden');

	const {status, body} = await commitSites({
		projectId: ctx.params.id,
		dataSourceId: ctx.params.dataSourceId,
		period: ctx.params.period,
		user: ctx.state.user,
		body: ctx.request.body
	});

	ctx.status = status;
	ctx.body = body;
});

export default router;
