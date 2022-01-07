let ThreadManager
const { db, ObjectId } = require('../../mongodb')
const logger = require('@overleaf/logger')
const metrics = require('@overleaf/metrics')

module.exports = ThreadManager = {
  GLOBAL_THREAD: 'GLOBAL',

  findOrCreateThread(projectId, threadId, callback) {
    let query, update
    projectId = ObjectId(projectId.toString())
    if (threadId !== ThreadManager.GLOBAL_THREAD) {
      threadId = ObjectId(threadId.toString())
    }

    if (threadId === ThreadManager.GLOBAL_THREAD) {
      query = {
        project_id: projectId,
        thread_id: { $exists: false },
      }
      update = {
        project_id: projectId,
      }
    } else {
      query = {
        project_id: projectId,
        thread_id: threadId,
      }
      update = {
        project_id: projectId,
        thread_id: threadId,
      }
    }

    db.rooms.findOneAndUpdate(
      query,
      { $set: update },
      { upsert: true, returnDocument: 'after' },
      function (error, result) {
        if (error) {
          return callback(error)
        }
        callback(null, result.value)
      }
    )
  },

  findAllThreadRooms(projectId, callback) {
    db.rooms
      .find(
        {
          project_id: ObjectId(projectId.toString()),
          thread_id: { $exists: true },
        },
        {
          thread_id: 1,
          resolved: 1,
        }
      )
      .toArray(callback)
  },

  resolveThread(projectId, threadId, userId, callback) {
    db.rooms.updateOne(
      {
        project_id: ObjectId(projectId.toString()),
        thread_id: ObjectId(threadId.toString()),
      },
      {
        $set: {
          resolved: {
            user_id: userId,
            ts: new Date(),
          },
        },
      },
      callback
    )
  },

  reopenThread(projectId, threadId, callback) {
    db.rooms.updateOne(
      {
        project_id: ObjectId(projectId.toString()),
        thread_id: ObjectId(threadId.toString()),
      },
      {
        $unset: {
          resolved: true,
        },
      },
      callback
    )
  },

  deleteThread(projectId, threadId, callback) {
    this.findOrCreateThread(projectId, threadId, function (error, room) {
      if (error) {
        return callback(error)
      }
      db.rooms.deleteOne(
        {
          _id: room._id,
        },
        function (error) {
          if (error) {
            return callback(error)
          }
          callback(null, room._id)
        }
      )
    })
  },
}
;[
  'findOrCreateThread',
  'findAllThreadRooms',
  'resolveThread',
  'reopenThread',
  'deleteThread',
].map(method =>
  metrics.timeAsyncMethod(ThreadManager, method, 'mongo.ThreadManager', logger)
)
