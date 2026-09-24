package bank_management.example.banking_system.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserResponseDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Integer age;
    private String gender;
    private String address;
    private String phoneNumber;
    private OffsetDateTime createdAt;
    private List<AccountResponseDto> accounts;
}
