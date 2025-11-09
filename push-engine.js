const axios = require('axios')

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY

exports.sendPush = async (deviceToken, title, body) => {
  await axios.post('https://fcm.googleapis.com/fcm/send', {
    to: deviceToken,
    notification: { title, body }
  }, {
    headers: {
      Authorization: `key=${FCM_SERVER_KEY}`,
      'Content-Type': 'application/json'
    }
  })
}
