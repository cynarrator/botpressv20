import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw, StandardError, BPRequest } from 'common/http'
import { Request, Response } from 'express'
import _ from 'lodash'
import moment from 'moment'

import Database from './db'

const getCustomMetricName = (name: string) => {
  if (name.startsWith('cm_')) {
    return name
  }

  return `cm_${name}`
}

export default (bp: typeof sdk, db: Database) => {
  const asyncMiddleware = asyncMw(bp.logger)
  const router = bp.http.createRouterForBot('analytics')

  router.get(
    '/channel/:channel',
    asyncMiddleware(async (req: BPRequest, res: Response) => {
      const { botId, channel } = req.params
      const { start, end } = req.query

      try {
        const startDate = unixToDate(start as string)
        const endDate = unixToDate(end as string)
        const metrics = await db.getMetrics(botId, { startDate, endDate, channel })
        res.send({ metrics })
      } catch (err) {
        throw new StandardError('Cannot get analytics', err)
      }
    })
  )

  router.get('/custom_metrics/:name', async (req: BPRequest, res: Response) => {
    try {
      const { botId, name } = req.params
      const { start, end } = req.query

      const startDate = start ? moment(start as string).toDate() : moment().toDate()
      const endDate = end ? moment(end as string).toDate() : moment().toDate()

      const metrics = await db.getMetric(botId, '', getCustomMetricName(name), {
        startDate,
        endDate
      })
      res.send({ success: true, metrics })
    } catch (err) {
      res.send({ success: false, message: err.message })
    }
  })

  router.post('/custom_metrics/:name/:method', async (req: BPRequest, res: Response) => {
    try {
      const { botId, method, name } = req.params
      const { count, date } = req.body

      switch (method) {
        case 'increment':
          db.incrementMetric(botId, '', getCustomMetricName(name))
          break
        case 'decrement':
          db.decrementMetric(botId, '', getCustomMetricName(name))
          break
        case 'set':
          const metricDate = date ? moment(date).toDate() : moment().toDate()
          await db.setMetric(botId, '', getCustomMetricName(name), { count, date: metricDate })
          break
        default:
          res.send({ success: false, message: 'Invalid method, use increment, decrement or set' })
          return
      }

      res.send({ success: true })
    } catch (err) {
      res.send({ success: false, message: err.message })
    }
  })

  const unixToDate = (unix: string | number) => {
    const unixNumber = typeof unix === 'string' ? parseInt(unix, 10) : unix
    const momentDate = moment.unix(unixNumber)
    if (!momentDate.isValid()) {
      throw new Error(`Invalid unix timestamp format ${unix}.`)
    }

    return moment.utc(momentDate.format('YYYY-MM-DD')).toDate()
  }
}
