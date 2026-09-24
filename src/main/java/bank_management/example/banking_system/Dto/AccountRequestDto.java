package bank_management.example.banking_system.Dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AccountRequestDto {

    @NotNull(message = "User ID is required")
    private Long userId;

    @DecimalMin(value = "0.0", inclusive = true, message = "Initial deposit cannot be negative")
    @Builder.Default
    private Double initialDeposit = 0.0;

    @NotBlank(message = "Account type is required (e.g. SAVINGS, CURRENT)")
    @Pattern(regexp = "^(?i)(SAVINGS|CURRENT)$", message = "Account type must be either SAVINGS or CURRENT")
    private String acctType;
}
