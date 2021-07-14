/**
 * MultiProgress bar. Can be recursive. As a MultiProgress can have itself multiples MultiProgress
 */
export class MultiProgress {
  //if no onProgressMother bar, should maybe avoid all the creation
  constructor(onProgressMother = () => {}) {
    this.percentages = []
    this.onProgressMother = onProgressMother
  }

  /**
   * Create a new sub progress bar
   */
  add(debugInfo) {
    let idx = this.percentages.length
    this.percentages[idx] = 0 //thus add new item
    return percentage => {
      this.percentages[idx] = percentage
      // console.log(debugInfo, percentage)
      this.update()
    }
  }

  update() {
    let sum = this.percentages.reduce((acc, val) => acc + val, 0)
    this.onProgressMother(sum/this.percentages.length) //average, all progress bar, have same importance (eg if 2: 50%/50%, if 3: 33%/33%/33%, ...)
    // console.log(sum, this.length, this.percentages.length)
  }
}