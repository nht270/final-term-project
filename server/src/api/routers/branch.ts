import { Router } from 'express'
import * as BranchController from '../controllers/branch.js'

const router = Router()

router.get('/', BranchController.getBranches)
router.get('/:id', BranchController.getBranch)
router.get('/search/:text', BranchController.search)

export default router