"use strict";

const db = require("../db");

class Job{

    /** Find all job titles for companies.
   *
   * Returns [{ title, salary, equity, company_handle }]
   * */

  static async findAll({ minSalary, hasEquity, title } = {}) {
    let query = await db.query(
          `SELECT 
           j.id,
           j.title,
           j.salary,
           j.equity,
           j.company_handle AS "companyHandle",
           c.name AS "companyName"
           FROM jobs j 
           LEFT JOIN companies AS c ON c.handle = j.company_handle`);
    
    let whereExpressions = []
    let queryValues = []
  
    if(minSalary !== undefined){
      queryValues.push(minSalary)
      whereExpressions.push(`salary >= $${queryValues.length}`)
    }

    if(hasEquity === true){
      whereExpressions.push(`equity > 0`)
    }

    if(title !== undefined) {
      queryValues.push(`%${title}%`)
      whereExpressions.push(`title ILIKE $${queryValues.length}`)
    }

    if(whereExpressions.length > 0){
      query += " WHERE " + whereExpressions.join(" AND ")
    }

    query += " ORDER BY title"
    const jobsRes = await db.query(query, queryValues)
    return jobsRes.rows
  }


    /** Given a company id, return data about company.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

    static async get(id) {
        const jobRes = await db.query(
              `SELECT id, 
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
               FROM jobs
               WHERE id = $1`,
            [id]);
    
        const job = jobRes.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);

        const companiesRes = await db.query(`
              SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url AS "logoUrl"
               FROM companies
               WHERE handle = $1`,
              [job.companyHandle])

        delete job.companyHandle
        job.company = companiesRes.rows[0]
    
        return job;
      }


    /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns {title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1);
    
        const querySql = `UPDATE jobs 
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id, 
                          title,
                          salary,
                          equity,
                          company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No company: ${id}`);
    
        return job;
    }


    /** Delete given job from database; returns undefined.
    *
    * Throws NotFoundError if job not found.
    **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,[id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);
  }

}

module.exports = Job