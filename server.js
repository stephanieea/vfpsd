const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch');
const app = express()


const environment = process.env.NODE_ENV || 'development'
const configuration = require('./knexfile')[environment]
const database = require('knex')(configuration)


const countValues = require('./server-helpers/server-helpers.js').countValues
const ratio = require('./server-helpers/server-helpers.js').ratio
const removeNotTrueOrFalse = require('./server-helpers/server-helpers.js').removeNotTrueOrFalse

app.use(cors())
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next()
})
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

app.set('port', process.env.PORT || 3000)

app.locals.title = 'Fatal Police Shootings'

app.get('/', (request, response) => {
  fs.readFile(`${__dirname}/index.html`, (err, file) => {
    response.send(file)
  })
})

app.get('/data/state-poplulation-data.csv', (request, response) => {
  fs.readFile(`${__dirname}/data/state-populations.csv`, (err, file) => {
    response.send(file)
  })
})

app.get('/data/us.json', (request, response) => {
  fs.readFile(`${__dirname}/data/us.json`, (err, file) => {
    response.send(file)
  })
})

app.get('/data/fatal-police-shootings-data.csv', (request, response) => {
  fs.readFile(`${__dirname}/data/fatal-police-shootings-data.csv`, (err, file) => {
    response.send(file)
  })
})

app.get('/data/external/:state', (request, response) => {
  const { state } = request.params
   fetch(`http://api.sba.gov/geodata/city_links_for_state_of/${state}.json`)
    .then(data => {
      return data.json()
    })
    .then(data => {
      response.send(data);
    })
    .catch(error => console.log(error))
})

app.get('/api/v1/all', (request, response) => {
  const year = request.query.year

  database('fatal_police_shootings_data').select()
    .then((fatal_police_shootings_data) => {
      if (year) {
        const filtered_data = fatal_police_shootings_data.filter((incident) => {
          return incident.date.includes(year)})
        if (filtered_data.length == 0) {
          response.status(404).send({
            error: 'There are no incidents for this year'
          })
        } else {
          response.status(200).send(filtered_data)
        }
      } else  {
        response.status(200).send(fatal_police_shootings_data)
      }
    })
    .catch((error) => {
      response.status(500).send({error: 'somethings wrong with db'})
  });
})

app.get('/api/v1/all/:id', (request, response) => {
  const { id } = request.params

  database('fatal_police_shootings_data').where('id', id)
    .then((fatal_police_shootings_data) => {
      if (fatal_police_shootings_data.length == 0) {
        response.status(404).send({error: 'double check the id'})
      } else {
        response.status(200).send(fatal_police_shootings_data)
      }
    })
    .catch((error) => {
      response.status(500).send({error: 'server error'})
    })
})

app.get('/api/v1/state-territory/:abbreviation/incidents', (request, response) => {
  const { abbreviation } = request.params
 database('fatal_police_shootings_data').where('state', abbreviation)
   .then((fatal_police_shootings_data) => {
     if (fatal_police_shootings_data.length === 0) {
       response.status(404).send({error: 'no incidents found for the place you entered'})
     } else {
     response.status(200).send(fatal_police_shootings_data)
     }
   })
   .catch((error) => {
     response.status(500).send({error: 'somethings wrong with db'})
   })
})

app.get('/api/v1/state-territory/:abbreviation/mental-illness', (request, response) => {
  const { abbreviation } = request.params
 database('fatal_police_shootings_data').where('state', abbreviation)
   .then((fatal_police_shootings_data) => {
     if (fatal_police_shootings_data.length === 0) {
       response.status(404).send({error: 'no incidents found for the place you entered'})
     } else {
       const mIValues = fatal_police_shootings_data.map(incident => incident.signs_of_mental_illness)
       const denominator = mIValues.length
       const count = countValues(mIValues)
       const ratios = ratio(count, denominator)
       response.status(200).send({ratios: ratios})
     }
   })
   .catch((error) => {
     response.status(500).send({error: 'somethings wrong with db'})
   })
})

app.get('/api/v1/state-territory/:abbreviation/body-camera', (request, response) => {
  const { abbreviation } = request.params
 database('fatal_police_shootings_data').where('state', abbreviation)
   .then((fatal_police_shootings_data) => {
     if (fatal_police_shootings_data.length === 0) {
       response.status(404).send({error: 'no incidents found for the place you entered'})
     } else {
       const footageValues = fatal_police_shootings_data.map(incident => incident.body_camera)
       const denominator = footageValues.length
       const count = countValues(footageValues)
       const ratios = ratio(count, denominator)
       response.status(200).send({ratios: ratios})
     }
   })
   .catch((error) => {
     response.status(500).send({error: 'somethings wrong with db'})
   })
})

app.get('/api/v1/state-territory/:abbreviation/armed', (request, response) => {
  const { abbreviation } = request.params
 database('fatal_police_shootings_data').where('state', abbreviation)
   .then((fatal_police_shootings_data) => {
     if (fatal_police_shootings_data.length === 0) {
       response.status(404).send({error: 'no incidents found for the place you entered'})
     } else {
       const armedValues = fatal_police_shootings_data.map(incident => incident.armed)
       const denominator = armedValues.length
       const count = countValues(armedValues)
       const ratios = ratio(count, denominator)
       response.status(200).send({ratios: ratios})
     }
   })
   .catch((error) => {
     response.status(500).send({error: 'somethings wrong with db'})
   })
})

app.get('/api/v1/state-territory/:abbreviation/race', (request, response) => {
  const { abbreviation } = request.params
 database('fatal_police_shootings_data').where('state', abbreviation)
   .then((fatal_police_shootings_data) => {
     if (fatal_police_shootings_data.length === 0) {
       response.status(404).send({error: 'no incidents found for the place you entered'})
     } else {
       const raceValues = fatal_police_shootings_data.map(incident => incident.race)
       const denominator = raceValues.length
       const count = countValues(raceValues)
       const ratios = ratio(count, denominator)
       response.status(200).send({ratios: ratios})
     }
   })
   .catch((error) => {
     response.status(500).send({error: 'somethings wrong with db'})
   })
})

app.get('/api/v1/mental-illness', (request, response) => {
  database('fatal_police_shootings_data').select()
    .then((fatal_police_shootings_data) => {
      const mIValues = fatal_police_shootings_data.map(incident => incident.signs_of_mental_illness)
      const denominator = mIValues.length
      let count = countValues(mIValues)
      removeNotTrueOrFalse(count)
      const ratios = ratio(count, denominator)
      response.status(200).send({ratios: ratios})
    })
    .catch((error) => {
      response.sendStatus(500).send({error: 'servers error'})
    })
})

app.get('/api/v1/body-camera', (request, response) => {
  database('fatal_police_shootings_data').select()
    .then((fatal_police_shootings_data) => {
      const footageValues = fatal_police_shootings_data.map(incident => incident.body_camera)
      const count = countValues(footageValues)
      const denominator = footageValues.length
      const ratios = ratio(count, denominator)
      response.status(200).send({ratios: ratios})
    })
    .catch((error) => {
      response.sendStatus(500).send({error: 'servers error'})
    })
})

app.get('/api/v1/armed', (request, response) => {
  database('fatal_police_shootings_data').select()
    .then((fatal_police_shootings_data) => {
      const armedValues = fatal_police_shootings_data.map(incident => incident.armed)
      const count = countValues(armedValues)
      const denominator = armedValues.length
      const ratios = ratio(count, denominator)
      response.status(200).send({ratios: ratios})
    })
    .catch((error) => {
      response.sendStatus(500).send({error: 'servers error'})
    })
})

app.get('/api/v1/race', (request, response) => {
  database('fatal_police_shootings_data').select()
    .then((fatal_police_shootings_data) => {
      const raceValues = fatal_police_shootings_data.map(incident => incident.race)
      const count = countValues(raceValues)
      const denominator = raceValues.length
      const ratios = ratio(count, denominator)
      response.status(200).send({ratios: ratios})
    })
    .catch((error) => {
      response.sendStatus(500).send({error: 'servers error'})
    })
})

app.post('/api/v1/all', (request, response) => {
  if (Object.keys(request.body).length > 14) {
    response.status(422).send({error: 'incorrect format'})
  } else {
    const { name, date, manner_of_death, armed, age, gender, race, city, state,
      signs_of_mental_illness, threat_level, flee, body_camera } = request.body

    if ( !body_camera || !name || !date || !manner_of_death || !armed || !age ||
      !gender || !race || !city || !state || !signs_of_mental_illness ||
      !threat_level || !flee || !body_camera) {
      response.status(422).send({error: 'All properties are not provided'})
    } else {
      const incident = { name, date, manner_of_death, armed, age, gender, race,
        city, state, signs_of_mental_illness, threat_level, flee, body_camera }

      database('fatal_police_shootings_data').insert(incident)
      .then(() => {
        database('fatal_police_shootings_data').select()
        .then((fatal_police_shootings_data) => {
          response.status(200).json(fatal_police_shootings_data)
        })
      })
      .catch((error) => {
        console.error('somethings wrong with db')
        response.sendStatus(500)
      })
    }
  }
})

// update information for an incident
app.patch('/api/v1/all/:id', (request, response) => {
  const updates = request.body
  const { id } = request.params
  database('fatal_police_shootings_data').where('id', id).select().update(updates)
    .then(() => {
      database('fatal_police_shootings_data').where('id', id).select()
      .then((fatal_police_shootings_data) => {
        if (fatal_police_shootings_data.length === 0) {
          response.status(404).send({error: 'no incidents for this id'})
        } else {
          response.status(200).send(fatal_police_shootings_data)
        }
      })
    })
    .catch((error) => {
      response.status(500).send({error: 'something\'s wrong with db'})
    })
})

// delete an incident
app.delete('/api/v1/all/:id', (request, response) => {
  const { id } = request.params
  database('fatal_police_shootings_data').where('id', id).del()
      .then((fatal_police_shootings_data) => {
        if(fatal_police_shootings_data === 0){
          response.status(404).send({error: 'id not found'})
        } else {
          response.status(200).send({message: `incident for id ${id} deleted`})
        }
      })
      .catch((error) => {
        response.status(500).send({error: 'server error'})
      })
})


app.listen(app.get('port'), () => {
  console.log(`${app.locals.title} is running on ${app.get('port')}.`)
})


module.exports = app
