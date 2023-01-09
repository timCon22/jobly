"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobSearchSchema = require("../schemas/jobSearch.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const db = require("../db");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { id, title, salary, equity, companyHandle, company }
 *
 * Returns { title, salary, equity, company_handle }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.create(req.body);
      return res.status(201).json({ company });
    } catch (err) {
      return next(err);
    }
  });


/** GET /  =>
 *   { jobs: [ { title, salary, equity, company_handle } ] }
 *
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
    const q = req.query
    if(q.minSalary !== undefined)q.minSalary = +q.minSalary
    q.hasEquity = q.hasEquity ==="true"

    try {
        const validator = jsonschema.validate(q, jobSearchSchema)
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }
        
        const jobs = await Job.findAll(q);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
  });


router.get("/:id", async function(req, res, next){

    try{
        const job = await Job.get(req.params.id)
        return res.json({ job })
    } catch (err) {
        return next(err)
    }
})


router.patch("/:id", ensureAdmin, async function(req, res, next){

    try{
        const validator = jsonschema.validate(req.body, jobUpdateSchema)
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs)
        }

        const job = await Job.update(req.params.id, req.body)
        return res.json({ job })
    } catch(err) {
        return next(err)
    }

})


router.delete("/:id", ensureAdmin, async function(req, res, next){
    try{
        await Job.remove(req.params.id)
        return res.json({ deleted: +req.params.id })
    } catch(err) {
        return next(err)
    }
})


module.exports = router;