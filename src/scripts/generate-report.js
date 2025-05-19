const fs = require('fs');
const path = require('path');

class CustomReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options || {};
    this.testResults = [];
    this.startTime = null;
    this.endTime = null;
    this.outputFile = options.outputFile || 'test-results.txt';
    this.logContent = [];
  }

  _log(message = '') {
    this.logContent.push(message);
  }

  onRunStart(results, options) {
    this.startTime = new Date();
    this._log('\n🚀 Iniciando pruebas...\n');
  }

  onTestStart(test) {
    this._log(`▶️ Ejecutando: ${test.path}`);
  }

  onTestResult(test, testResult, aggregatedResults) {
    const { numFailingTests, numPassingTests, numPendingTests, testResults } = testResult;

    this._log(`\n📄 Archivo: ${test.path}`);
    this._log(`✅ Pruebas exitosas: ${numPassingTests}`);
    this._log(`❌ Pruebas fallidas: ${numFailingTests}`);
    this._log(`⏸️ Pruebas pendientes: ${numPendingTests}`);

    if (numFailingTests > 0) {
      this._log('\n🔍 Detalles de fallos:');
      testResults.forEach(result => {
        if (result.status === 'failed') {
          this._log(`\n❌ ${result.fullName || result.title}`);
          result.failureMessages.forEach(message => {
            this._log(`   ${this._formatError(message)}`);
          });
        }
      });
    }

    this.testResults.push(testResult);
  }

  onRunComplete(contexts, results) {
    this.endTime = new Date();
    const duration = (this.endTime - this.startTime) / 1000;

    this._log('\n📊 Resumen final:');
    this._log(`🧪 Total pruebas: ${results.numTotalTests}`);
    this._log(`✅ Exitosas: ${results.numPassedTests}`);
    this._log(`❌ Fallidas: ${results.numFailedTests}`);
    this._log(`⏸️ Pendientes: ${results.numPendingTests}`);
    this._log(`⏱️ Tiempo total: ${duration.toFixed(2)} segundos`);

    if (results.numFailedTests > 0) {
      this._log('\n❌ Algunas pruebas han fallado');
    } else {
      this._log('\n✅ Todas las pruebas han pasado correctamente');
    }

    // Guardar en archivo
    try {
      const outputPath = path.resolve(process.cwd(), this.outputFile);
      fs.writeFileSync(outputPath, this.logContent.join('\n'), 'utf8');
      console.log(`\n📁 Reporte guardado en: ${outputPath}`);
    } catch (err) {
      console.error('❌ Error al guardar el archivo de resultados:', err);
    }
  }

  _formatError(error) {
    return error
      .split('\n')
      .slice(0, 3)
      .join('\n   ')
      .replace(/\u001b\[\d+m/g, ''); // Eliminar caracteres de color ANSI
  }
}

module.exports = CustomReporter;
