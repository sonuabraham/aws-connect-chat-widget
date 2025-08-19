/**
 * Utility functions export
 * Provides easy access to all validation and utility functions
 */

// Export all validation functions
export {
  validateConfiguration,
  validateConfigurationField,
  validateWidgetPosition,
  validateThemeConfiguration,
  validateAWSConnectConfiguration,
  validateMessageConfiguration,
  validateFeatureConfiguration,
  WidgetConfigurationValidator,
  defaultValidator,
  configurationSchema
} from './validation';

// Export validation types
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ConfigurationValidator,
  ConfigurationSchema,
  FieldSchema,
  ValidatorFunction
} from '../types/validation';

// Export styling utilities
export {
  useStyles,
  useVariants,
  mergeClassNames,
  createResponsiveStyles,
  createThemeStyles,
  commonStyles,
  createButtonStyles,
  createInputStyles,
  createSurfaceStyles
} from './styled';

// Export styling types
export type {
  StyleFunction,
  StyleObject,
  ResponsiveStyles,
  StyleVariants,
  StyleDefinition
} from './styled';